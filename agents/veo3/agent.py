"""
Veo3Agent - Google Veo 3 Video Generation Agent

A specialized agent for generating high-quality videos using Google's Veo 3 model.
Supports various video formats, durations, and generation parameters.
"""

import json
import asyncio
import subprocess
import base64
import tempfile
import os
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
import aiohttp
import logging
from dotenv import load_dotenv
from google.cloud import storage
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Veo3Agent:
    """
    Google Veo 3 Video Generation Agent
    
    Provides comprehensive video generation capabilities using Google's Veo 3 model,
    including prompt-based generation, operation monitoring, and result retrieval.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize the Veo3 Agent with configuration."""
        self.config = self._load_config(config_path)
        
        # Load from environment variables first, then config, then defaults
        self.project_id = (
            os.getenv('GOOGLE_PROJECT_ID') or 
            self.config.get('project_id', 'gen-lang-client-0313251790')
        )
        self.location_id = (
            os.getenv('GOOGLE_LOCATION_ID') or 
            self.config.get('location_id', 'us-central1')
        )
        self.api_endpoint = f"{self.location_id}-aiplatform.googleapis.com"
        self.model_id = (
            os.getenv('VEO3_MODEL_ID') or 
            self.config.get('model_id', 'veo-3.0-generate-preview')
        )
        self.api_key = (
            os.getenv('GOOGLE_API_KEY') or 
            self.config.get('api_key')
        )
        
        if not self.api_key:
            raise ValueError(
                "Google API key not found. Please set GOOGLE_API_KEY environment variable "
                "or add 'api_key' to your configuration file."
            )
        
        # Google Cloud Storage configuration
        self.gcs_bucket_name = (
            os.getenv('GCS_BUCKET_NAME') or 
            self.config.get('gcs_bucket_name', 'veo3_campanha_01')
        )
        self.gcs_auto_upload = (
            os.getenv('GCS_AUTO_UPLOAD', 'true').lower() == 'true' or
            self.config.get('gcs_auto_upload', True)
        )
        self.gcs_folder_prefix = (
            os.getenv('GCS_FOLDER_PREFIX') or
            self.config.get('gcs_folder_prefix', 'videos/')
        )
        
        # Initialize GCS client if auto upload is enabled
        self.gcs_client = None
        if self.gcs_auto_upload:
            try:
                self.gcs_client = storage.Client(project=self.project_id)
                logger.info(f"GCS client initialized for bucket: {self.gcs_bucket_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize GCS client: {e}")
                logger.warning("Videos will be saved locally only")
        
        # Generation presets
        self.presets = {
            'quick': {
                'aspectRatio': '16:9',
                'sampleCount': 1,
                'durationSeconds': '4',
                'addWatermark': True,
                'generateAudio': False
            },
            'standard': {
                'aspectRatio': '16:9',
                'sampleCount': 2,
                'durationSeconds': '8',
                'addWatermark': True,
                'generateAudio': True
            },
            'premium': {
                'aspectRatio': '16:9',
                'sampleCount': 4,
                'durationSeconds': '12',
                'addWatermark': False,
                'generateAudio': True
            },
            'portrait': {
                'aspectRatio': '9:16',
                'sampleCount': 2,
                'durationSeconds': '8',
                'addWatermark': True,
                'generateAudio': True
            },
            'square': {
                'aspectRatio': '1:1',
                'sampleCount': 2,
                'durationSeconds': '6',
                'addWatermark': True,
                'generateAudio': True
            }
        }
    
    def _load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """Load configuration from file or use defaults."""
        if config_path and Path(config_path).exists():
            with open(config_path, 'r') as f:
                return json.load(f)
        
        # Try to load from agent directory
        agent_dir = Path(__file__).parent
        config_file = agent_dir / "a2a-config.json"
        if config_file.exists():
            with open(config_file, 'r') as f:
                return json.load(f)
        
        return {}
    
    def _upload_to_gcs(self, video_path: Path, operation_id: str, video_index: int = 0) -> Optional[str]:
        """
        Upload video to Google Cloud Storage.
        
        Args:
            video_path: Local path to the video file
            operation_id: Operation ID for naming
            video_index: Index of the video for multiple videos
            
        Returns:
            GCS URL if successful, None if failed
        """
        if not self.gcs_client:
            logger.warning("GCS client not initialized, skipping upload")
            return None
            
        try:
            bucket = self.gcs_client.bucket(self.gcs_bucket_name)
            
            # Generate unique filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            operation_short = operation_id.split('/')[-1][:8] if '/' in operation_id else operation_id[:8]
            
            gcs_filename = f"{self.gcs_folder_prefix}veo3_{timestamp}_{operation_short}_v{video_index + 1}.mp4"
            
            # Upload the file
            blob = bucket.blob(gcs_filename)
            
            logger.info(f"Uploading video to GCS: gs://{self.gcs_bucket_name}/{gcs_filename}")
            
            with open(video_path, 'rb') as video_file:
                blob.upload_from_file(video_file, content_type='video/mp4')
            
            # Make the blob publicly accessible (optional)
            # blob.make_public()
            
            gcs_url = f"gs://{self.gcs_bucket_name}/{gcs_filename}"
            logger.info(f"Video uploaded successfully: {gcs_url}")
            
            return gcs_url
            
        except Exception as e:
            logger.error(f"Failed to upload video to GCS: {e}")
            return None
    
    def _get_access_token(self) -> str:
        """Get access token using gcloud auth."""
        try:
            result = subprocess.run(
                ['gcloud', 'auth', 'print-access-token'],
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to get access token: {e}")
            raise Exception("Failed to authenticate with Google Cloud")
    
    async def generate_video(
        self, 
        prompt: str, 
        preset: str = 'standard',
        custom_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate a video using the specified prompt and parameters.
        
        Args:
            prompt: The text prompt describing the video to generate
            preset: Preset configuration (quick, standard, premium, portrait, square)
            custom_params: Custom generation parameters to override preset
            
        Returns:
            Dict containing operation ID and status
        """
        try:
            # Get generation parameters
            if preset in self.presets:
                params = self.presets[preset].copy()
            else:
                params = self.presets['standard'].copy()
            
            # Override with custom parameters if provided
            if custom_params:
                params.update(custom_params)
            
            # Ensure required parameters
            params.setdefault('personGeneration', 'allow_all')
            params.setdefault('includeRaiReason', True)
            
            # Prepare request payload
            request_payload = {
                "instances": [{"prompt": prompt}],
                "parameters": params
            }
            
            # Get access token
            access_token = self._get_access_token()
            
            # Make API request
            url = (f"https://{self.api_endpoint}/v1/projects/{self.project_id}/"
                   f"locations/{self.location_id}/publishers/google/models/"
                   f"{self.model_id}:predictLongRunning")
            
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {access_token}'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=request_payload, headers=headers) as response:
                    if response.status == 200:
                        result = await response.json()
                        operation_name = result.get('name', '')
                        
                        logger.info(f"Video generation started: {operation_name}")
                        
                        return {
                            'success': True,
                            'operation_id': operation_name,
                            'status': 'started',
                            'prompt': prompt,
                            'parameters': params,
                            'message': 'Video generation request submitted successfully'
                        }
                    else:
                        error_text = await response.text()
                        logger.error(f"API request failed: {response.status} - {error_text}")
                        return {
                            'success': False,
                            'error': f"API request failed: {response.status}",
                            'details': error_text
                        }
                        
        except Exception as e:
            logger.error(f"Error generating video: {e}")
            return {
                'success': False,
                'error': str(e),
                'details': 'Failed to submit video generation request'
            }
    
    async def check_operation_status(self, operation_id: str) -> Dict[str, Any]:
        """
        Check the status of a video generation operation.
        
        Args:
            operation_id: The operation ID returned from generate_video
            
        Returns:
            Dict containing current operation status
        """
        try:
            # Clean operation ID (remove quotes if present)
            clean_operation_id = operation_id.strip().strip('"')
            
            # Prepare request payload
            request_payload = {
                "operationName": clean_operation_id
            }
            
            # Get access token
            access_token = self._get_access_token()
            
            # Make API request
            url = (f"https://{self.api_endpoint}/v1/projects/{self.project_id}/"
                   f"locations/{self.location_id}/publishers/google/models/"
                   f"{self.model_id}:fetchPredictOperation")
            
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {access_token}'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=request_payload, headers=headers) as response:
                    if response.status == 200:
                        result = await response.json()
                        
                        # Extract status information
                        done = result.get('done', False)
                        metadata = result.get('metadata', {})
                        
                        status_info = {
                            'success': True,
                            'operation_id': clean_operation_id,
                            'done': done,
                            'status': 'completed' if done else 'running',
                            'metadata': metadata
                        }
                        
                        # If completed, check for results or errors
                        if done:
                            if 'response' in result:
                                status_info['has_results'] = True
                                status_info['message'] = 'Video generation completed successfully'
                            elif 'error' in result:
                                status_info['has_error'] = True
                                status_info['error'] = result['error']
                                status_info['message'] = 'Video generation failed'
                        else:
                            status_info['message'] = 'Video generation in progress'
                        
                        logger.info(f"Operation status: {status_info['status']}")
                        return status_info
                        
                    else:
                        error_text = await response.text()
                        logger.error(f"Status check failed: {response.status} - {error_text}")
                        return {
                            'success': False,
                            'error': f"Status check failed: {response.status}",
                            'details': error_text
                        }
                        
        except Exception as e:
            logger.error(f"Error checking operation status: {e}")
            return {
                'success': False,
                'error': str(e),
                'details': 'Failed to check operation status'
            }
    
    async def fetch_video_results(self, operation_id: str, save_to_disk: bool = True) -> Dict[str, Any]:
        """
        Fetch the generated video results from a completed operation.
        
        Args:
            operation_id: The operation ID returned from generate_video
            save_to_disk: Whether to save videos to disk (default: True)
            
        Returns:
            Dict containing video data or file paths
        """
        try:
            # First check if operation is completed
            status = await self.check_operation_status(operation_id)
            
            if not status.get('success'):
                return status
            
            if not status.get('done'):
                return {
                    'success': False,
                    'error': 'Operation not completed yet',
                    'status': status.get('status', 'running'),
                    'message': 'Please wait for video generation to complete'
                }
            
            if status.get('has_error'):
                return {
                    'success': False,
                    'error': 'Video generation failed',
                    'details': status.get('error', {})
                }
            
            # Clean operation ID
            clean_operation_id = operation_id.strip().strip('"')
            
            # Prepare request payload
            request_payload = {
                "operationName": clean_operation_id
            }
            
            # Get access token
            access_token = self._get_access_token()
            
            # Make API request
            url = (f"https://{self.api_endpoint}/v1/projects/{self.project_id}/"
                   f"locations/{self.location_id}/publishers/google/models/"
                   f"{self.model_id}:fetchPredictOperation")
            
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {access_token}'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=request_payload, headers=headers) as response:
                    if response.status == 200:
                        result = await response.json()
                        
                        # Extract video data
                        response_data = result.get('response', {})
                        predictions = response_data.get('predictions', [])
                        
                        if not predictions:
                            return {
                                'success': False,
                                'error': 'No video data found in response',
                                'details': 'The operation completed but no videos were generated'
                            }
                        
                        videos = []
                        
                        for i, prediction in enumerate(predictions):
                            video_data = prediction.get('bytesBase64Encoded', '')
                            
                            if not video_data:
                                continue
                            
                            video_info = {
                                'index': i,
                                'size_mb': len(video_data) * 3 / 4 / 1024 / 1024  # Approximate size
                            }
                            
                            if save_to_disk:
                                # Save video to disk
                                output_dir = Path.cwd() / "generated_videos"
                                output_dir.mkdir(exist_ok=True)
                                
                                video_filename = f"veo3_video_{i+1}_{clean_operation_id.split('/')[-1][:8]}.mp4"
                                video_path = output_dir / video_filename
                                
                                # Decode and save video
                                video_bytes = base64.b64decode(video_data)
                                with open(video_path, 'wb') as f:
                                    f.write(video_bytes)
                                
                                video_info['file_path'] = str(video_path)
                                video_info['saved'] = True
                                
                                logger.info(f"Video saved to: {video_path}")
                                
                                # Upload to GCS if enabled
                                if self.gcs_auto_upload and self.gcs_client:
                                    gcs_url = self._upload_to_gcs(video_path, clean_operation_id, i)
                                    if gcs_url:
                                        video_info['gcs_url'] = gcs_url
                                        video_info['gcs_uploaded'] = True
                                    else:
                                        video_info['gcs_uploaded'] = False
                                
                            else:
                                video_info['base64_data'] = video_data
                                video_info['saved'] = False
                            
                            videos.append(video_info)
                        
                        result_info = {
                            'success': True,
                            'operation_id': clean_operation_id,
                            'video_count': len(videos),
                            'videos': videos,
                            'saved_to_disk': save_to_disk,
                            'message': f'Successfully retrieved {len(videos)} video(s)'
                        }
                        
                        if save_to_disk and videos:
                            result_info['output_directory'] = str(Path.cwd() / "generated_videos")
                        
                        # Add GCS information to result
                        if self.gcs_auto_upload and any(video.get('gcs_uploaded') for video in videos):
                            result_info['gcs_bucket'] = f"gs://{self.gcs_bucket_name}"
                            result_info['gcs_uploaded_count'] = sum(1 for video in videos if video.get('gcs_uploaded'))
                        
                        logger.info(f"Retrieved {len(videos)} video(s)")
                        return result_info
                        
                    else:
                        error_text = await response.text()
                        logger.error(f"Failed to fetch results: {response.status} - {error_text}")
                        return {
                            'success': False,
                            'error': f"Failed to fetch results: {response.status}",
                            'details': error_text
                        }
                        
        except Exception as e:
            logger.error(f"Error fetching video results: {e}")
            return {
                'success': False,
                'error': str(e),
                'details': 'Failed to fetch video results'
            }
    
    def get_generation_presets(self) -> Dict[str, Any]:
        """Get available generation presets."""
        return {
            'presets': self.presets,
            'default': 'standard',
            'description': {
                'quick': 'Fast generation with basic quality (4s, 1 sample)',
                'standard': 'Balanced quality and speed (8s, 2 samples)',
                'premium': 'High quality, longer duration (12s, 4 samples)',
                'portrait': 'Vertical format for mobile (9:16 aspect ratio)',
                'square': 'Square format for social media (1:1 aspect ratio)'
            },
            'gcs_config': {
                'bucket': self.gcs_bucket_name,
                'auto_upload': self.gcs_auto_upload,
                'folder_prefix': self.gcs_folder_prefix,
                'client_initialized': self.gcs_client is not None
            }
        }
    
    async def generate_with_brazilian_comedian_prompt(self, custom_message: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate video using the predefined Brazilian comedian prompt.
        
        Args:
            custom_message: Custom message for the comedian to say (optional)
            
        Returns:
            Dict containing operation ID and status
        """
        # Base prompt template
        base_prompt = """Create an ultra-realistic, high-resolution video of a casual studio monologue scene, featuring a charismatic white Brazilian comedian with a strong.

He has thick, full medium-length curly hair, a defined jawline, trimmed goatee, and expressive eyes. He wears a loose, clean oversized white T-shirt and a **silver chain that must always remain clearly visible, worn outside the shirt as a key part of his visual identity**. His appearance is clean, expressive, and relaxed, without any visible tattoos.  

The scene takes place in a minimalist studio with a neutral matte background and soft ambient shadows. The environment is clean and focused entirely on the speaker. He stands centered, facing the camera directly. His voice carries the rhythm, expressiveness, and natural charisma of a strong Northeastern Brazilian accent. He gestures with natural comedic timing, occasionally bringing his hands together at chest level for emphasis.  

Lighting: soft frontal light to preserve skin tone realism, with gentle side shadowing for dimension.  

Camera: 50mm lens in a tight medium shot, eye-level, centered on the subject.  

**IMPORTANT: Do not include any subtitles, captions, or on-screen text. The scene must remain visually clean, and the silver chain must stay fully visible at all times, worn outside the shirt.**"""
        
        # Default message
        default_message = "Tenha 10 vezes mais resultados com agentes. basta você entrar pelo link, bit ponto ly, barra, n 8 n , 10 x ! não perca mais tempo, entre agora!"
        
        # Use custom message if provided, otherwise use default
        message = custom_message if custom_message else default_message
        
        # Complete prompt with dialogue
        full_prompt = f"{base_prompt}\n\nIf there is dialogue, the subject says in Brazilian Portuguese:\n\n\"{message}\""
        
        # Generate video with premium preset for best quality
        return await self.generate_video(full_prompt, preset='premium')
    
    async def process_veo3_request(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process Veo3-specific requests for integration with other agents.
        
        Args:
            action: The action to perform (generate, status, fetch, presets)
            params: Parameters for the action
            
        Returns:
            Dict containing the result of the requested action
        """
        try:
            if action == 'generate':
                prompt = params.get('prompt', '')
                preset = params.get('preset', 'standard')
                custom_params = params.get('custom_params')
                
                if not prompt:
                    return {
                        'success': False,
                        'error': 'Prompt is required for video generation'
                    }
                
                return await self.generate_video(prompt, preset, custom_params)
                
            elif action == 'status':
                operation_id = params.get('operation_id', '')
                
                if not operation_id:
                    return {
                        'success': False,
                        'error': 'Operation ID is required for status check'
                    }
                
                return await self.check_operation_status(operation_id)
                
            elif action == 'fetch':
                operation_id = params.get('operation_id', '')
                save_to_disk = params.get('save_to_disk', True)
                
                if not operation_id:
                    return {
                        'success': False,
                        'error': 'Operation ID is required for fetching results'
                    }
                
                return await self.fetch_video_results(operation_id, save_to_disk)
                
            elif action == 'presets':
                return {
                    'success': True,
                    'result': self.get_generation_presets()
                }
                
            elif action == 'comedian':
                custom_message = params.get('message')
                return await self.generate_with_brazilian_comedian_prompt(custom_message)
                
            else:
                return {
                    'success': False,
                    'error': f'Unknown action: {action}',
                    'available_actions': ['generate', 'status', 'fetch', 'presets', 'comedian']
                }
                
        except Exception as e:
            logger.error(f"Error processing Veo3 request: {e}")
            return {
                'success': False,
                'error': str(e),
                'details': 'Failed to process Veo3 request'
            }