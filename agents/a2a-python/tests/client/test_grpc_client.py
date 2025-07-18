from unittest.mock import AsyncMock

import pytest

from a2a.client import A2AGrpcClient
from a2a.grpc import a2a_pb2, a2a_pb2_grpc
from a2a.types import (
    AgentCapabilities,
    AgentCard,
    Message,
    MessageSendParams,
    Part,
    Role,
    Task,
    TaskIdParams,
    TaskQueryParams,
    TaskState,
    TaskStatus,
    TextPart,
)
from a2a.utils import proto_utils


# Fixtures
@pytest.fixture
def mock_grpc_stub() -> AsyncMock:
    """Provides a mock gRPC stub with methods mocked."""
    stub = AsyncMock(spec=a2a_pb2_grpc.A2AServiceStub)
    stub.SendMessage = AsyncMock()
    stub.SendStreamingMessage = AsyncMock()
    stub.GetTask = AsyncMock()
    stub.CancelTask = AsyncMock()
    stub.CreateTaskPushNotification = AsyncMock()
    stub.GetTaskPushNotification = AsyncMock()
    return stub


@pytest.fixture
def sample_agent_card() -> AgentCard:
    """Provides a minimal agent card for initialization."""
    return AgentCard(
        name='gRPC Test Agent',
        description='Agent for testing gRPC client',
        url='grpc://localhost:50051',
        version='1.0',
        capabilities=AgentCapabilities(streaming=True, pushNotifications=True),
        defaultInputModes=['text/plain'],
        defaultOutputModes=['text/plain'],
        skills=[],
    )


@pytest.fixture
def grpc_client(
    mock_grpc_stub: AsyncMock, sample_agent_card: AgentCard
) -> A2AGrpcClient:
    """Provides an A2AGrpcClient instance."""
    return A2AGrpcClient(grpc_stub=mock_grpc_stub, agent_card=sample_agent_card)


@pytest.fixture
def sample_message_send_params() -> MessageSendParams:
    """Provides a sample MessageSendParams object."""
    return MessageSendParams(
        message=Message(
            role=Role.user,
            messageId='msg-1',
            parts=[Part(root=TextPart(text='Hello'))],
        )
    )


@pytest.fixture
def sample_task() -> Task:
    """Provides a sample Task object."""
    return Task(
        id='task-1',
        contextId='ctx-1',
        status=TaskStatus(state=TaskState.completed),
    )


@pytest.fixture
def sample_message() -> Message:
    """Provides a sample Message object."""
    return Message(
        role=Role.agent,
        messageId='msg-response',
        parts=[Part(root=TextPart(text='Hi there'))],
    )


@pytest.mark.asyncio
async def test_send_message_task_response(
    grpc_client: A2AGrpcClient,
    mock_grpc_stub: AsyncMock,
    sample_message_send_params: MessageSendParams,
    sample_task: Task,
):
    """Test send_message that returns a Task."""
    mock_grpc_stub.SendMessage.return_value = a2a_pb2.SendMessageResponse(
        task=proto_utils.ToProto.task(sample_task)
    )

    response = await grpc_client.send_message(sample_message_send_params)

    mock_grpc_stub.SendMessage.assert_awaited_once()
    assert isinstance(response, Task)
    assert response.id == sample_task.id


@pytest.mark.asyncio
async def test_get_task(
    grpc_client: A2AGrpcClient, mock_grpc_stub: AsyncMock, sample_task: Task
):
    """Test retrieving a task."""
    mock_grpc_stub.GetTask.return_value = proto_utils.ToProto.task(sample_task)
    params = TaskQueryParams(id=sample_task.id)

    response = await grpc_client.get_task(params)

    mock_grpc_stub.GetTask.assert_awaited_once_with(
        a2a_pb2.GetTaskRequest(name=f'tasks/{sample_task.id}')
    )
    assert response.id == sample_task.id


@pytest.mark.asyncio
async def test_cancel_task(
    grpc_client: A2AGrpcClient, mock_grpc_stub: AsyncMock, sample_task: Task
):
    """Test cancelling a task."""
    cancelled_task = sample_task.model_copy()
    cancelled_task.status.state = TaskState.canceled
    mock_grpc_stub.CancelTask.return_value = proto_utils.ToProto.task(
        cancelled_task
    )
    params = TaskIdParams(id=sample_task.id)

    response = await grpc_client.cancel_task(params)

    mock_grpc_stub.CancelTask.assert_awaited_once_with(
        a2a_pb2.CancelTaskRequest(name=f'tasks/{sample_task.id}')
    )
    assert response.status.state == TaskState.canceled
