#include <combo.h>

/* Disable filters on pictobox - for emu */
PATCH_START 0x80165e28
  nop
PATCH_END

/* Disable all entrance cutscenes */
PATCH_START 0x800edcc4
  li t7,1
PATCH_END

/* Disable fast time flow when not having ocarina */
PATCH_START 0x80130154
  li t9,0
PATCH_END

/* Colossal wallet has 3 digits */
PATCH_START 0x801bfd2a
.short 3
PATCH_END

/* Disable morning music - required to fix an OoT fanfare crash */
PATCH_START 0x800fB8c4
  jal 0x801a25e4
PATCH_END
