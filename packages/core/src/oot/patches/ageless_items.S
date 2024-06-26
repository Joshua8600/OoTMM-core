#include <combo.h>

#define AGELESS_ITEM(id)       AGELESS_PATCH (0x80829d74 + (id))
#define AGELESS_EQUIP(id)      AGELESS_PATCH (0x80829d8c + (id))
#define AGELESS_HIGHLIGHT(id)  AGELESS_PATCH (0x80829d9c + (id))

.macro AGELESS_PATCH addr
PATCH_START \addr
.byte 0x09
PATCH_END
.endm

/* Swords */
PATCH_GROUP PG_OOT_AGELESS_SWORDS
AGELESS_EQUIP(0x01)
AGELESS_EQUIP(0x02)
AGELESS_EQUIP(0x03)
AGELESS_HIGHLIGHT(ITEM_OOT_SWORD_KOKIRI)
AGELESS_HIGHLIGHT(ITEM_OOT_SWORD_MASTER)
AGELESS_HIGHLIGHT(ITEM_OOT_SWORD_KNIFE_BIGGORON)
AGELESS_HIGHLIGHT(ITEM_OOT_SWORD_KNIFE_BROKEN)
PATCH_GROUP_END

/* Shields */
PATCH_GROUP PG_OOT_AGELESS_SHIELDS
AGELESS_EQUIP(0x05)
AGELESS_EQUIP(0x06)
AGELESS_EQUIP(0x07)
AGELESS_HIGHLIGHT(ITEM_OOT_SHIELD_DEKU)
AGELESS_HIGHLIGHT(ITEM_OOT_SHIELD_HYLIAN)
AGELESS_HIGHLIGHT(ITEM_OOT_SHIELD_MIRROR)
PATCH_GROUP_END

/* Tunics */
PATCH_GROUP PG_OOT_AGELESS_TUNICS
AGELESS_EQUIP(0x09)
AGELESS_EQUIP(0x0a)
AGELESS_EQUIP(0x0b)
AGELESS_HIGHLIGHT(ITEM_OOT_TUNIC_KOKIRI)
AGELESS_HIGHLIGHT(ITEM_OOT_TUNIC_GORON)
AGELESS_HIGHLIGHT(ITEM_OOT_TUNIC_ZORA)
PATCH_GROUP_END

/* Boots */
PATCH_GROUP PG_OOT_AGELESS_BOOTS
AGELESS_EQUIP(0x0d)
AGELESS_EQUIP(0x0e)
AGELESS_EQUIP(0x0f)
AGELESS_HIGHLIGHT(ITEM_OOT_BOOTS_KOKIRI)
AGELESS_HIGHLIGHT(ITEM_OOT_BOOTS_IRON)
AGELESS_HIGHLIGHT(ITEM_OOT_BOOTS_HOVER)
PATCH_GROUP_END

/* Sticks */
PATCH_GROUP PG_OOT_AGELESS_STICKS
AGELESS_ITEM(ITS_OOT_STICKS)
AGELESS_HIGHLIGHT(ITEM_OOT_STICK)
PATCH_GROUP_END

/* Boomerang */
PATCH_GROUP PG_OOT_AGELESS_BOOMERANG
AGELESS_ITEM(ITS_OOT_BOOMERANG)
AGELESS_HIGHLIGHT(ITEM_OOT_BOOMERANG)
PATCH_GROUP_END

/* Hammer */
PATCH_GROUP PG_OOT_AGELESS_HAMMER
AGELESS_ITEM(ITS_OOT_HAMMER)
AGELESS_HIGHLIGHT(ITEM_OOT_HAMMER)
PATCH_GROUP_END

/* Hookshot */
PATCH_GROUP PG_OOT_AGELESS_HOOKSHOT
AGELESS_ITEM(ITS_OOT_HOOKSHOT)
AGELESS_HIGHLIGHT(ITEM_OOT_HOOKSHOT)
AGELESS_HIGHLIGHT(ITEM_OOT_LONGSHOT)
PATCH_GROUP_END

/* Slingshot */
PATCH_GROUP PG_OOT_AGELESS_SLINGSHOT
AGELESS_ITEM(ITS_OOT_SLINGSHOT)
AGELESS_HIGHLIGHT(ITEM_OOT_SLINGSHOT)
PATCH_GROUP_END

/* Bow */
PATCH_GROUP PG_OOT_AGELESS_BOW
AGELESS_ITEM(ITS_OOT_BOW)
AGELESS_ITEM(ITS_OOT_ARROW_FIRE)
AGELESS_ITEM(ITS_OOT_ARROW_ICE)
AGELESS_ITEM(ITS_OOT_ARROW_LIGHT)
AGELESS_HIGHLIGHT(ITEM_OOT_BOW)
AGELESS_HIGHLIGHT(ITEM_OOT_ARROW_FIRE)
AGELESS_HIGHLIGHT(ITEM_OOT_ARROW_ICE)
AGELESS_HIGHLIGHT(ITEM_OOT_ARROW_LIGHT)
PATCH_GROUP_END

/* Child trade */
PATCH_GROUP PG_OOT_AGELESS_CHILD_TRADE
AGELESS_ITEM(ITS_OOT_TRADE_CHILD)
AGELESS_HIGHLIGHT(ITEM_OOT_WEIRD_EGG)
AGELESS_HIGHLIGHT(ITEM_OOT_CHICKEN)
AGELESS_HIGHLIGHT(ITEM_OOT_ZELDA_LETTER)
AGELESS_HIGHLIGHT(ITEM_OOT_KEATON_MASK)
AGELESS_HIGHLIGHT(ITEM_OOT_SKULL_MASK)
AGELESS_HIGHLIGHT(ITEM_OOT_SPOOKY_MASK)
AGELESS_HIGHLIGHT(ITEM_OOT_BUNNY_HOOD)
AGELESS_HIGHLIGHT(ITEM_OOT_GORON_MASK)
AGELESS_HIGHLIGHT(ITEM_OOT_ZORA_MASK)
AGELESS_HIGHLIGHT(ITEM_OOT_GERUDO_MASK)
AGELESS_HIGHLIGHT(ITEM_OOT_MASK_OF_TRUTH)
PATCH_GROUP_END
