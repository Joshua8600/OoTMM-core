#include <combo.h>

/* Patch Medigoron bytecode */
PATCH_START 0x80a162a9
.short 0x0
PATCH_END

PATCH_START 0x80a162bf
.short 0x0
PATCH_END

PATCH_GROUP PG_MM_KEG_STRENGTH_3

PATCH_START 0x80a16280
  .byte MSCRIPT_CUSTOM_CMD_ID_CHECK_STRENGTH_3
PATCH_END

PATCH_GROUP_END
