"""Prompt string constants."""

from .relicks_prompt import RELICKS_SYSTEM_PROMPT
from .relicks_prompt import USER_PROMPT_TEMPLATE as RELICKS_USER_PROMPT
from .system_prompt import MASTERCLASS_SYSTEM_PROMPT
from .system_prompt import USER_PROMPT_TEMPLATE as MASTERCLASS_USER_PROMPT

__all__ = [
    "MASTERCLASS_SYSTEM_PROMPT",
    "MASTERCLASS_USER_PROMPT",
    "RELICKS_SYSTEM_PROMPT",
    "RELICKS_USER_PROMPT",
]
