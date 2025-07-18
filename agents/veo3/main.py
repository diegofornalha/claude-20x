#!/usr/bin/env python3
"""
Veo3 Agent - Main Entry Point

Google Veo 3 Video Generation Agent for creating high-quality videos.
Supports interactive mode and CLI operations.
"""

import asyncio
import argparse
import json
import sys
from pathlib import Path

from agent import Veo3Agent


async def interactive_mode():
    """Run the agent in interactive mode for testing and development."""
    agent = Veo3Agent()
    
    print("\n🎬 Veo3 Agent - Google Video Generation")
    print("=" * 50)
    print("Available commands:")
    print("  generate <prompt> - Generate video from prompt")
    print("  status <operation_id> - Check operation status")
    print("  fetch <operation_id> - Fetch video results")
    print("  presets - List available generation presets")
    print("  help - Show this help message")
    print("  exit - Exit interactive mode")
    print("=" * 50)
    
    while True:
        try:
            command = input("\nveo3> ").strip()
            
            if not command:
                continue
                
            if command.lower() in ['exit', 'quit']:
                print("👋 Goodbye!")
                break
                
            if command.lower() == 'help':
                print("\nAvailable commands:")
                print("  generate <prompt> - Generate video from prompt")
                print("  status <operation_id> - Check operation status")
                print("  fetch <operation_id> - Fetch video results")
                print("  presets - List available generation presets")
                continue
                
            parts = command.split(' ', 1)
            cmd = parts[0].lower()
            
            if cmd == 'generate':
                if len(parts) < 2:
                    print("❌ Usage: generate <prompt>")
                    continue
                prompt = parts[1]
                result = await agent.generate_video(prompt)
                print(f"✅ Generation started: {result}")
                
            elif cmd == 'status':
                if len(parts) < 2:
                    print("❌ Usage: status <operation_id>")
                    continue
                operation_id = parts[1]
                result = await agent.check_operation_status(operation_id)
                print(f"📊 Status: {result}")
                
            elif cmd == 'fetch':
                if len(parts) < 2:
                    print("❌ Usage: fetch <operation_id>")
                    continue
                operation_id = parts[1]
                result = await agent.fetch_video_results(operation_id)
                print(f"🎥 Results: {result}")
                
            elif cmd == 'presets':
                presets = agent.get_generation_presets()
                print(f"🎯 Available presets: {json.dumps(presets, indent=2)}")
                
            else:
                print(f"❌ Unknown command: {cmd}")
                
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")


async def main():
    """Main entry point for the Veo3 Agent."""
    parser = argparse.ArgumentParser(description="Veo3 Agent - Google Video Generation")
    parser.add_argument("--interactive", "-i", action="store_true", help="Run in interactive mode")
    parser.add_argument("--generate", "-g", type=str, help="Generate video from prompt")
    parser.add_argument("--status", "-s", type=str, help="Check operation status")
    parser.add_argument("--fetch", "-f", type=str, help="Fetch video results")
    parser.add_argument("--config", "-c", type=str, help="Path to config file")
    
    args = parser.parse_args()
    
    if args.interactive:
        await interactive_mode()
    elif args.generate:
        agent = Veo3Agent()
        result = await agent.generate_video(args.generate)
        print(json.dumps(result, indent=2))
    elif args.status:
        agent = Veo3Agent()
        result = await agent.check_operation_status(args.status)
        print(json.dumps(result, indent=2))
    elif args.fetch:
        agent = Veo3Agent()
        result = await agent.fetch_video_results(args.fetch)
        print(json.dumps(result, indent=2))
    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())