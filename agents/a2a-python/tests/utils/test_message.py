import uuid

from unittest.mock import patch

from a2a.types import (
    DataPart,
    Message,
    Part,
    Role,
    TextPart,
)
from a2a.utils.message import (
    get_message_text,
    get_text_parts,
    new_agent_parts_message,
    new_agent_text_message,
)


class TestNewAgentTextMessage:
    def test_new_agent_text_message_basic(self):
        # Setup
        text = "Hello, I'm an agent"

        # Exercise - with a fixed uuid for testing
        with patch(
            'uuid.uuid4',
            return_value=uuid.UUID('12345678-1234-5678-1234-567812345678'),
        ):
            message = new_agent_text_message(text)

        # Verify
        assert message.role == Role.agent
        assert len(message.parts) == 1
        assert message.parts[0].root.text == text
        assert message.messageId == '12345678-1234-5678-1234-567812345678'
        assert message.taskId is None
        assert message.contextId is None

    def test_new_agent_text_message_with_context_id(self):
        # Setup
        text = 'Message with context'
        context_id = 'test-context-id'

        # Exercise
        with patch(
            'uuid.uuid4',
            return_value=uuid.UUID('12345678-1234-5678-1234-567812345678'),
        ):
            message = new_agent_text_message(text, context_id=context_id)

        # Verify
        assert message.role == Role.agent
        assert message.parts[0].root.text == text
        assert message.messageId == '12345678-1234-5678-1234-567812345678'
        assert message.contextId == context_id
        assert message.taskId is None

    def test_new_agent_text_message_with_task_id(self):
        # Setup
        text = 'Message with task id'
        task_id = 'test-task-id'

        # Exercise
        with patch(
            'uuid.uuid4',
            return_value=uuid.UUID('12345678-1234-5678-1234-567812345678'),
        ):
            message = new_agent_text_message(text, task_id=task_id)

        # Verify
        assert message.role == Role.agent
        assert message.parts[0].root.text == text
        assert message.messageId == '12345678-1234-5678-1234-567812345678'
        assert message.taskId == task_id
        assert message.contextId is None

    def test_new_agent_text_message_with_both_ids(self):
        # Setup
        text = 'Message with both ids'
        context_id = 'test-context-id'
        task_id = 'test-task-id'

        # Exercise
        with patch(
            'uuid.uuid4',
            return_value=uuid.UUID('12345678-1234-5678-1234-567812345678'),
        ):
            message = new_agent_text_message(
                text, context_id=context_id, task_id=task_id
            )

        # Verify
        assert message.role == Role.agent
        assert message.parts[0].root.text == text
        assert message.messageId == '12345678-1234-5678-1234-567812345678'
        assert message.contextId == context_id
        assert message.taskId == task_id

    def test_new_agent_text_message_empty_text(self):
        # Setup
        text = ''

        # Exercise
        with patch(
            'uuid.uuid4',
            return_value=uuid.UUID('12345678-1234-5678-1234-567812345678'),
        ):
            message = new_agent_text_message(text)

        # Verify
        assert message.role == Role.agent
        assert message.parts[0].root.text == ''
        assert message.messageId == '12345678-1234-5678-1234-567812345678'


class TestNewAgentPartsMessage:
    def test_new_agent_parts_message(self):
        """Test creating an agent message with multiple, mixed parts."""
        # Setup
        parts = [
            Part(root=TextPart(text='Here is some text.')),
            Part(root=DataPart(data={'product_id': 123, 'quantity': 2})),
        ]
        context_id = 'ctx-multi-part'
        task_id = 'task-multi-part'

        # Exercise
        with patch(
            'uuid.uuid4',
            return_value=uuid.UUID('abcdefab-cdef-abcd-efab-cdefabcdefab'),
        ):
            message = new_agent_parts_message(
                parts, context_id=context_id, task_id=task_id
            )

        # Verify
        assert message.role == Role.agent
        assert message.parts == parts
        assert message.contextId == context_id
        assert message.taskId == task_id
        assert message.messageId == 'abcdefab-cdef-abcd-efab-cdefabcdefab'


class TestGetTextParts:
    def test_get_text_parts_single_text_part(self):
        # Setup
        parts = [Part(root=TextPart(text='Hello world'))]

        # Exercise
        result = get_text_parts(parts)

        # Verify
        assert result == ['Hello world']

    def test_get_text_parts_multiple_text_parts(self):
        # Setup
        parts = [
            Part(root=TextPart(text='First part')),
            Part(root=TextPart(text='Second part')),
            Part(root=TextPart(text='Third part')),
        ]

        # Exercise
        result = get_text_parts(parts)

        # Verify
        assert result == ['First part', 'Second part', 'Third part']

    def test_get_text_parts_empty_list(self):
        # Setup
        parts = []

        # Exercise
        result = get_text_parts(parts)

        # Verify
        assert result == []


class TestGetMessageText:
    def test_get_message_text_single_part(self):
        # Setup
        message = Message(
            role=Role.agent,
            parts=[Part(root=TextPart(text='Hello world'))],
            messageId='test-message-id',
        )

        # Exercise
        result = get_message_text(message)

        # Verify
        assert result == 'Hello world'

    def test_get_message_text_multiple_parts(self):
        # Setup
        message = Message(
            role=Role.agent,
            parts=[
                Part(root=TextPart(text='First line')),
                Part(root=TextPart(text='Second line')),
                Part(root=TextPart(text='Third line')),
            ],
            messageId='test-message-id',
        )

        # Exercise
        result = get_message_text(message)

        # Verify - default delimiter is newline
        assert result == 'First line\nSecond line\nThird line'

    def test_get_message_text_custom_delimiter(self):
        # Setup
        message = Message(
            role=Role.agent,
            parts=[
                Part(root=TextPart(text='First part')),
                Part(root=TextPart(text='Second part')),
                Part(root=TextPart(text='Third part')),
            ],
            messageId='test-message-id',
        )

        # Exercise
        result = get_message_text(message, delimiter=' | ')

        # Verify
        assert result == 'First part | Second part | Third part'

    def test_get_message_text_empty_parts(self):
        # Setup
        message = Message(
            role=Role.agent,
            parts=[],
            messageId='test-message-id',
        )

        # Exercise
        result = get_message_text(message)

        # Verify
        assert result == ''
