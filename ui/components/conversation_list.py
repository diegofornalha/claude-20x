import mesop as me
import pandas as pd

from state.host_agent_service import CreateConversation
from state.state import AppState, StateConversation


@me.component
def conversation_list(conversations: list[StateConversation]):
    """Conversation list component"""
    df_data: dict[str, list[str | int]] = {
        'ID': [],
        'Name': [],
        'Status': [],
        'Messages': [],
    }
    for conversation in conversations:
        df_data['ID'].append(conversation.conversation_id)
        df_data['Name'].append(conversation.conversation_name)
        df_data['Status'].append('Open' if conversation.is_active else 'Closed')
        df_data['Messages'].append(len(conversation.message_ids))
    df = pd.DataFrame(
        pd.DataFrame(df_data), columns=['ID', 'Name', 'Status', 'Messages']
    )
    with me.box(
        style=me.Style(
            display='flex',
            justify_content='space-between',
            flex_direction='column',
        )
    ):
        if not conversations:
            with me.box(
                style=me.Style(
                    display='flex',
                    justify_content='center',
                    align_items='center',
                    flex_direction='column',
                    min_height='200px'
                )
            ):
                me.text(
                    "🎉 Nenhuma conversa iniciada por enquanto.",
                    style=me.Style(
                        text_align='center',
                        font_size=16,
                        color='#666',
                        margin=me.Margin.all(32)
                    )
                )
        else:
            me.table(
                df,
                on_click=on_click,
                header=me.TableHeader(sticky=True),
                columns={
                    'ID': me.TableColumn(sticky=True),
                    'Name': me.TableColumn(sticky=True),
                    'Status': me.TableColumn(sticky=True),
                    'Messages': me.TableColumn(sticky=True),
                },
            )
        
        with me.content_button(
            type='raised',
            on_click=add_conversation,
            key='new_conversation',
            style=me.Style(
                display='flex',
                flex_direction='row',
                gap=5,
                align_items='center',
                margin=me.Margin(top=10),
            ),
        ):
            me.icon(icon='add')


async def add_conversation(e: me.ClickEvent):  # pylint: disable=unused-argument
    """Add conversation button handler"""
    response = await CreateConversation()
    me.state(AppState).messages = []
    me.navigate(
        '/conversation',
        query_params={'conversation_id': response.conversation_id},
    )
    yield


def on_click(e: me.TableClickEvent):
    state = me.state(AppState)
    conversation = state.conversations[e.row_index]
    state.current_conversation_id = conversation.conversation_id
    me.query_params.update({'conversation_id': conversation.conversation_id})
    me.navigate('/conversation', query_params=me.query_params)
    yield
