"""
Página de agentes com lista simples (sem tabela complexa)
"""

import asyncio
import mesop as me

from components.dialog import dialog, dialog_actions
from components.header import header
from components.page_scaffold import page_frame, page_scaffold
from state.agent_state import AgentState
from state.host_agent_service import AddRemoteAgent, ListRemoteAgents
from state.state import AppState
from utils.agent_card import get_agent_card


def agent_list_page_simple(app_state: AppState):
    """Agents List Page - Versão simples"""
    state = me.state(AgentState)
    with page_scaffold():  # pylint: disable=not-context-manager
        with page_frame():
            with header('Remote Agents', 'smart_toy'):
                # Botão para adicionar agente manualmente
                with me.box(style=me.Style(display='flex', justify_content='flex-end')):
                    me.button(
                        '➕ Adicionar Agente Manualmente',
                        on_click=open_add_agent_dialog,
                        style=me.Style(
                            background="#27ae60",
                            color="white",
                            border_radius=6,
                            padding=me.Padding.all(8)
                        )
                    )
            
            # Lista simples de agentes
            try:
                agents = asyncio.run(ListRemoteAgents())
                
                if not agents:
                    me.text(
                        '📡 Nenhum agente registrado ainda.',
                        style=me.Style(
                            text_align='center',
                            font_size=16,
                            color='#666',
                            margin=me.Margin.all(32)
                        )
                    )
                    me.text(
                        'Clique no botão acima para adicionar um agente manualmente.',
                        style=me.Style(
                            text_align='center',
                            font_size=14,
                            color='#888',
                            margin=me.Margin.all(16)
                        )
                    )
                else:
                    me.text(
                        f'📡 {len(agents)} agente(s) registrado(s)',
                        style=me.Style(
                            font_weight='bold',
                            font_size=16,
                            margin=me.Margin(bottom=16)
                        )
                    )
                    
                    # Mostrar cada agente
                    for agent in agents:
                        with me.box(
                            style=me.Style(
                                border=me.Border.all(me.BorderSide(color="#e0e0e0", width=1, style="solid")),
                                border_radius=8,
                                margin=me.Margin(bottom=10),
                                padding=me.Padding.all(16),
                                background="#f9f9f9"
                            )
                        ):
                            # Tentar acessar os atributos de forma segura
                            if hasattr(agent, 'name'):
                                me.text(agent.name, style=me.Style(font_weight='bold', font_size=16))
                            elif isinstance(agent, dict) and 'name' in agent:
                                me.text(agent['name'], style=me.Style(font_weight='bold', font_size=16))
                            else:
                                me.text('Agente sem nome', style=me.Style(font_weight='bold', font_size=16))
                            
                            if hasattr(agent, 'url'):
                                me.text(f'URL: {agent.url}', style=me.Style(font_size=14, color='#666'))
                            elif isinstance(agent, dict) and 'url' in agent:
                                me.text(f'URL: {agent["url"]}', style=me.Style(font_size=14, color='#666'))
                            
                            if hasattr(agent, 'description'):
                                me.text(agent.description, style=me.Style(font_size=14, color='#888'))
                            elif isinstance(agent, dict) and 'description' in agent:
                                me.text(agent['description'], style=me.Style(font_size=14, color='#888'))
                                
            except Exception as e:
                me.text(
                    f'❌ Erro ao listar agentes: {str(e)}',
                    style=me.Style(color='red', margin=me.Margin.all(16))
                )
            
            # Dialog para adicionar agente
            with dialog(state.agent_dialog_open):
                # Título do dialog
                me.text(
                    '🤖 Adicionar Agente Manualmente',
                    style=me.Style(
                        font_size=20,
                        font_weight='bold',
                        margin=me.Margin(bottom=16)
                    )
                )
                
                with me.box(
                    style=me.Style(
                        display='flex', flex_direction='column', gap=12
                    )
                ):
                    me.text(
                        'Digite o endereço do agente (hostname:porta):',
                        style=me.Style(font_size=14, color='#666')
                    )
                    me.input(
                        label='Agent Address',
                        on_blur=set_agent_address,
                        placeholder='localhost:10000',
                    )
                    me.text(
                        'Exemplos: localhost:9999, localhost:10030, 192.168.1.100:8080',
                        style=me.Style(font_size=12, color='#888', font_style='italic')
                    )
                    input_modes_string = ', '.join(state.input_modes)
                    output_modes_string = ', '.join(state.output_modes)

                    if state.error != '':
                        me.text(state.error, style=me.Style(color='red'))
                    if state.agent_name != '':
                        me.text(f'Agent Name: {state.agent_name}')
                    if state.agent_description:
                        me.text(f'Agent Description: {state.agent_description}')
                    if state.agent_framework_type:
                        me.text(
                            f'Agent Framework Type: {state.agent_framework_type}'
                        )
                    if state.input_modes:
                        me.text(f'Input Modes: {input_modes_string}')
                    if state.output_modes:
                        me.text(f'Output Modes: {output_modes_string}')

                    if state.agent_name:
                        me.text(
                            f'Streaming Supported: {state.stream_supported}'
                        )
                        me.text(
                            f'Push Notifications Supported: {state.push_notifications_supported}'
                        )
                with dialog_actions():
                    if not state.agent_name:
                        me.button('Read', on_click=load_agent_info)
                    elif not state.error:
                        me.button('Save', on_click=save_agent)
                    me.button('Cancel', on_click=cancel_agent_dialog)


def set_agent_address(e: me.InputBlurEvent):
    state = me.state(AgentState)
    state.agent_address = e.value


def load_agent_info(e: me.ClickEvent):
    state = me.state(AgentState)
    try:
        state.error = None
        agent_card_response = get_agent_card(state.agent_address)
        state.agent_name = agent_card_response.name
        state.agent_description = agent_card_response.description
        state.agent_framework_type = (
            agent_card_response.provider.organization
            if agent_card_response.provider
            else ''
        )
        state.input_modes = agent_card_response.defaultInputModes
        state.output_modes = agent_card_response.defaultOutputModes
        state.stream_supported = agent_card_response.capabilities.streaming
        state.push_notifications_supported = (
            agent_card_response.capabilities.pushNotifications
        )
    except Exception as e:
        print(e)
        state.agent_name = None
        state.error = f'Cannot connect to agent as {state.agent_address}'


def cancel_agent_dialog(e: me.ClickEvent):
    state = me.state(AgentState)
    state.agent_dialog_open = False
    # Limpar campos
    state.agent_address = ''
    state.agent_name = ''
    state.agent_description = ''
    state.error = ''


def open_add_agent_dialog(e: me.ClickEvent):
    """Abre o dialog para adicionar agente manualmente"""
    state = me.state(AgentState)
    state.agent_dialog_open = True
    # Limpar campos anteriores
    state.agent_address = ''
    state.agent_name = ''
    state.agent_description = ''
    state.error = ''


async def save_agent(e: me.ClickEvent):
    state = me.state(AgentState)
    await AddRemoteAgent(state.agent_address)
    state.agent_address = ''
    state.agent_name = ''
    state.agent_description = ''
    state.agent_dialog_open = False