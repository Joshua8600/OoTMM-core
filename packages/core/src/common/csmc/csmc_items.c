#include <combo.h>
#include <combo/csmc.h>

static int csmcFromItemOot(s16 gi)
{
    switch (gi)
    {
    case GI_OOT_STONE_EMERALD:
    case GI_OOT_STONE_RUBY:
    case GI_OOT_STONE_SAPPHIRE:
    case GI_OOT_MEDALLION_FOREST:
    case GI_OOT_MEDALLION_FIRE:
    case GI_OOT_MEDALLION_WATER:
    case GI_OOT_MEDALLION_SPIRIT:
    case GI_OOT_MEDALLION_SHADOW:
    case GI_OOT_MEDALLION_LIGHT:
    case GI_OOT_ARROW_FIRE:
    case GI_OOT_ARROW_ICE:
    case GI_OOT_ARROW_LIGHT:
    case GI_OOT_BOMB_BAG:
    case GI_OOT_BOMB_BAG2:
    case GI_OOT_BOMB_BAG3:
    case GI_OOT_BOOMERANG:
    case GI_OOT_BOOTS_HOVER:
    case GI_OOT_BOOTS_IRON:
    case GI_OOT_BOW:
    case GI_OOT_QUIVER2:
    case GI_OOT_QUIVER3:
    case GI_OOT_WEIRD_EGG:
    case GI_OOT_POCKET_EGG:
    case GI_OOT_CHICKEN:
    case GI_OOT_BOTTLE_EMPTY:
    case GI_OOT_GERUDO_CARD:
    case GI_OOT_HAMMER:
    case GI_OOT_HOOKSHOT:
    case GI_OOT_LONGSHOT:
    case GI_OOT_LENS:
    case GI_OOT_MAGIC_UPGRADE:
    case GI_OOT_MAGIC_UPGRADE2:
    case GI_OOT_OCARINA_FAIRY:
    case GI_OOT_OCARINA_TIME:
    case GI_OOT_RUTO_LETTER:
    case GI_OOT_SCALE_SILVER:
    case GI_OOT_SCALE_GOLDEN:
    case GI_OOT_SHIELD_MIRROR:
    case GI_OOT_PROGRESSIVE_SHIELD_DEKU:
    case GI_OOT_PROGRESSIVE_SHIELD_HYLIAN:
    case GI_OOT_SLINGSHOT:
    case GI_OOT_BULLET_BAG2:
    case GI_OOT_BULLET_BAG3:
    case GI_OOT_SONG_EPONA:
    case GI_OOT_SONG_SARIA:
    case GI_OOT_SONG_STORMS:
    case GI_OOT_SONG_SUN:
    case GI_OOT_SONG_TIME:
    case GI_OOT_SONG_ZELDA:
    case GI_OOT_SONG_TP_FOREST:
    case GI_OOT_SONG_TP_FIRE:
    case GI_OOT_SONG_TP_WATER:
    case GI_OOT_SONG_TP_SHADOW:
    case GI_OOT_SONG_TP_SPIRIT:
    case GI_OOT_SONG_TP_LIGHT:
    case GI_OOT_SPELL_FIRE:
    case GI_OOT_SPELL_WIND:
    case GI_OOT_SPELL_LOVE:
    case GI_OOT_GORON_BRACELET:
    case GI_OOT_SILVER_GAUNTLETS:
    case GI_OOT_GOLDEN_GAUNTLETS:
    case GI_OOT_SWORD_KOKIRI:
    case GI_OOT_SWORD_MASTER:
    case GI_OOT_SWORD_KNIFE:
    case GI_OOT_SWORD_BIGGORON:
    case GI_OOT_TUNIC_GORON:
    case GI_OOT_TUNIC_ZORA:
    case GI_OOT_ZELDA_LETTER:
    case GI_OOT_MAGIC_BEAN:
    case GI_OOT_BOTTLE_MILK:
    case GI_OOT_STONE_OF_AGONY:
    case GI_OOT_WALLET:
    case GI_OOT_WALLET2:
    case GI_OOT_WALLET3:
    case GI_OOT_WALLET4:
    case GI_OOT_WALLET5:
    case GI_OOT_POCKET_CUCCO:
    case GI_OOT_COJIRO:
    case GI_OOT_ODD_MUSHROOM:
    case GI_OOT_ODD_POTION:
    case GI_OOT_POACHER_SAW:
    case GI_OOT_BROKEN_GORON_SWORD:
    case GI_OOT_PRESCRIPTION:
    case GI_OOT_EYEBALL_FROG:
    case GI_OOT_EYE_DROPS:
    case GI_OOT_CLAIM_CHECK:
    case GI_OOT_MASK_TRUTH:
    case GI_OOT_MASK_SKULL:
    case GI_OOT_MASK_SPOOKY:
    case GI_OOT_MASK_KEATON:
    case GI_OOT_MASK_BUNNY:
    case GI_OOT_MASK_GORON:
    case GI_OOT_MASK_ZORA:
    case GI_OOT_MASK_GERUDO:
    case GI_OOT_STICK_UPGRADE:
    case GI_OOT_STICK_UPGRADE2:
    case GI_OOT_NUT_UPGRADE:
    case GI_OOT_NUT_UPGRADE2:
    case GI_OOT_DEFENSE_UPGRADE:
    case GI_OOT_TRIFORCE:
    case GI_OOT_TRIFORCE_POWER:
    case GI_OOT_TRIFORCE_COURAGE:
    case GI_OOT_TRIFORCE_WISDOM:
    case GI_OOT_SKELETON_KEY:
    case GI_OOT_COIN_RED:
    case GI_OOT_COIN_GREEN:
    case GI_OOT_COIN_BLUE:
    case GI_OOT_COIN_YELLOW:
    case GI_OOT_RUPEE_MAGICAL:
    case GI_OOT_BUTTON_A:
    case GI_OOT_BUTTON_C_RIGHT:
    case GI_OOT_BUTTON_C_LEFT:
    case GI_OOT_BUTTON_C_UP:
    case GI_OOT_BUTTON_C_DOWN:
        return CSMC_MAJOR;
    case GI_OOT_SMALL_KEY:
    case GI_OOT_SMALL_KEY_FOREST:
    case GI_OOT_SMALL_KEY_FIRE:
    case GI_OOT_SMALL_KEY_WATER:
    case GI_OOT_SMALL_KEY_SPIRIT:
    case GI_OOT_SMALL_KEY_SHADOW:
    case GI_OOT_SMALL_KEY_GANON:
    case GI_OOT_SMALL_KEY_BOTW:
    case GI_OOT_SMALL_KEY_GF:
    case GI_OOT_SMALL_KEY_GTG:
    case GI_OOT_SMALL_KEY_TCG:
    case GI_OOT_KEY_RING:
    case GI_OOT_KEY_RING_FOREST:
    case GI_OOT_KEY_RING_FIRE:
    case GI_OOT_KEY_RING_WATER:
    case GI_OOT_KEY_RING_SPIRIT:
    case GI_OOT_KEY_RING_SHADOW:
    case GI_OOT_KEY_RING_GANON:
    case GI_OOT_KEY_RING_BOTW:
    case GI_OOT_KEY_RING_GF:
    case GI_OOT_KEY_RING_GTG:
    case GI_OOT_KEY_RING_TCG:
    case GI_OOT_RUPEE_SILVER_DC:
    case GI_OOT_RUPEE_SILVER_BOTW:
    case GI_OOT_RUPEE_SILVER_SPIRIT_CHILD:
    case GI_OOT_RUPEE_SILVER_SPIRIT_SUN:
    case GI_OOT_RUPEE_SILVER_SPIRIT_BOULDERS:
    case GI_OOT_RUPEE_SILVER_SPIRIT_LOBBY:
    case GI_OOT_RUPEE_SILVER_SPIRIT_ADULT:
    case GI_OOT_RUPEE_SILVER_SHADOW_SCYTHE:
    case GI_OOT_RUPEE_SILVER_SHADOW_PIT:
    case GI_OOT_RUPEE_SILVER_SHADOW_SPIKES:
    case GI_OOT_RUPEE_SILVER_SHADOW_BLADES:
    case GI_OOT_RUPEE_SILVER_IC_SCYTHE:
    case GI_OOT_RUPEE_SILVER_IC_BLOCK:
    case GI_OOT_RUPEE_SILVER_GTG_SLOPES:
    case GI_OOT_RUPEE_SILVER_GTG_LAVA:
    case GI_OOT_RUPEE_SILVER_GTG_WATER:
    case GI_OOT_RUPEE_SILVER_GANON_SPIRIT:
    case GI_OOT_RUPEE_SILVER_GANON_LIGHT:
    case GI_OOT_RUPEE_SILVER_GANON_FIRE:
    case GI_OOT_RUPEE_SILVER_GANON_FOREST:
    case GI_OOT_RUPEE_SILVER_GANON_SHADOW:
    case GI_OOT_RUPEE_SILVER_GANON_WATER:
    case GI_OOT_POUCH_SILVER_DC:
    case GI_OOT_POUCH_SILVER_BOTW:
    case GI_OOT_POUCH_SILVER_SPIRIT_CHILD:
    case GI_OOT_POUCH_SILVER_SPIRIT_SUN:
    case GI_OOT_POUCH_SILVER_SPIRIT_BOULDERS:
    case GI_OOT_POUCH_SILVER_SPIRIT_LOBBY:
    case GI_OOT_POUCH_SILVER_SPIRIT_ADULT:
    case GI_OOT_POUCH_SILVER_SHADOW_SCYTHE:
    case GI_OOT_POUCH_SILVER_SHADOW_PIT:
    case GI_OOT_POUCH_SILVER_SHADOW_SPIKES:
    case GI_OOT_POUCH_SILVER_SHADOW_BLADES:
    case GI_OOT_POUCH_SILVER_IC_SCYTHE:
    case GI_OOT_POUCH_SILVER_IC_BLOCK:
    case GI_OOT_POUCH_SILVER_GTG_SLOPES:
    case GI_OOT_POUCH_SILVER_GTG_LAVA:
    case GI_OOT_POUCH_SILVER_GTG_WATER:
    case GI_OOT_POUCH_SILVER_GANON_SPIRIT:
    case GI_OOT_POUCH_SILVER_GANON_LIGHT:
    case GI_OOT_POUCH_SILVER_GANON_FIRE:
    case GI_OOT_POUCH_SILVER_GANON_FOREST:
    case GI_OOT_POUCH_SILVER_GANON_SHADOW:
    case GI_OOT_POUCH_SILVER_GANON_WATER:
        return CSMC_KEY;
    case GI_OOT_BOSS_KEY:
    case GI_OOT_BOSS_KEY_FOREST:
    case GI_OOT_BOSS_KEY_FIRE:
    case GI_OOT_BOSS_KEY_WATER:
    case GI_OOT_BOSS_KEY_SPIRIT:
    case GI_OOT_BOSS_KEY_SHADOW:
    case GI_OOT_BOSS_KEY_GANON:
        return CSMC_BOSS_KEY;
    case GI_OOT_GS_TOKEN:
        return CSMC_SPIDER;
    case GI_OOT_HEART_PIECE:
    case GI_OOT_HEART_CONTAINER:
    case GI_OOT_HEART_CONTAINER2:
    case GI_OOT_TC_HEART_PIECE:
        return comboConfig(CFG_CSMC_HEARTS) ? CSMC_HEART : CSMC_NORMAL;
    case GI_OOT_SOUL_STALFOS:
    case GI_OOT_SOUL_OCTOROK:
    case GI_OOT_SOUL_WALLMASTER:
    case GI_OOT_SOUL_DODONGO:
    case GI_OOT_SOUL_KEESE:
    case GI_OOT_SOUL_TEKTITE:
    case GI_OOT_SOUL_PEAHAT:
    case GI_OOT_SOUL_LIZALFOS_DINALFOS:
    case GI_OOT_SOUL_GOHMA_LARVA:
    case GI_OOT_SOUL_SHABOM:
    case GI_OOT_SOUL_BABY_DODONGO:
    case GI_OOT_SOUL_BIRI_BARI:
    case GI_OOT_SOUL_TAILPASARN:
    case GI_OOT_SOUL_SKULLTULA:
    case GI_OOT_SOUL_TORCH_SLUG:
    case GI_OOT_SOUL_MOBLIN:
    case GI_OOT_SOUL_ARMOS:
    case GI_OOT_SOUL_DEKU_BABA:
    case GI_OOT_SOUL_DEKU_SCRUB:
    case GI_OOT_SOUL_BUBBLE:
    case GI_OOT_SOUL_BEAMOS:
    case GI_OOT_SOUL_FLOORMASTER:
    case GI_OOT_SOUL_REDEAD_GIBDO:
    case GI_OOT_SOUL_SKULLWALLTULA:
    case GI_OOT_SOUL_FLARE_DANCER:
    case GI_OOT_SOUL_DEAD_HAND:
    case GI_OOT_SOUL_SHELL_BLADE:
    case GI_OOT_SOUL_LIKE_LIKE:
    case GI_OOT_SOUL_SPIKE:
    case GI_OOT_SOUL_ANUBIS:
    case GI_OOT_SOUL_IRON_KNUCKLE:
    case GI_OOT_SOUL_SKULL_KID:
    case GI_OOT_SOUL_FLYING_POT:
    case GI_OOT_SOUL_FREEZARD:
    case GI_OOT_SOUL_STINGER:
    case GI_OOT_SOUL_WOLFOS:
    case GI_OOT_SOUL_GUAY:
    case GI_OOT_SOUL_QUEEN_GOHMA:
    case GI_OOT_SOUL_KING_DODONGO:
    case GI_OOT_SOUL_BARINADE:
    case GI_OOT_SOUL_PHANTOM_GANON:
    case GI_OOT_SOUL_VOLVAGIA:
    case GI_OOT_SOUL_MORPHA:
    case GI_OOT_SOUL_BONGO_BONGO:
    case GI_OOT_SOUL_TWINROVA:
    case GI_OOT_SOUL_PARASITE:
    case GI_OOT_SOUL_DARK_LINK:
    case GI_OOT_SOUL_LEEVER:
    case GI_OOT_SOUL_STALCHILD:
        return CSMC_SOUL;
    }

    return CSMC_NORMAL;
}

static int csmcFromItemMm(s16 gi)
{
    switch (gi)
    {
    case GI_MM_REMAINS_ODOLWA:
    case GI_MM_REMAINS_GOHT:
    case GI_MM_REMAINS_GYORG:
    case GI_MM_REMAINS_TWINMOLD:
    case GI_MM_MASK_DEKU:
    case GI_MM_MASK_GORON:
    case GI_MM_MASK_ZORA:
    case GI_MM_MASK_CAPTAIN:
    case GI_MM_MASK_GIANT:
    case GI_MM_MASK_ALL_NIGHT:
    case GI_MM_MASK_BUNNY:
    case GI_MM_MASK_KEATON:
    case GI_MM_MASK_GARO:
    case GI_MM_MASK_ROMANI:
    case GI_MM_MASK_TROUPE_LEADER:
    case GI_MM_MASK_POSTMAN:
    case GI_MM_MASK_COUPLE:
    case GI_MM_MASK_GREAT_FAIRY:
    case GI_MM_MASK_GIBDO:
    case GI_MM_MASK_DON_GERO:
    case GI_MM_MASK_KAMARO:
    case GI_MM_MASK_TRUTH:
    case GI_MM_MASK_STONE:
    case GI_MM_MASK_BREMEN:
    case GI_MM_MASK_BLAST:
    case GI_MM_MASK_SCENTS:
    case GI_MM_MASK_KAFEI:
    case GI_MM_MASK_FIERCE_DEITY:
    case GI_MM_BOTTLE_POTION_RED:
    case GI_MM_BOTTLED_GOLD_DUST:
    case GI_MM_BOTTLE_EMPTY:
    case GI_MM_BOTTLE_MILK:
    case GI_MM_MAGIC_UPGRADE:
    case GI_MM_MAGIC_UPGRADE2:
    case GI_MM_SONG_TIME:
    case GI_MM_SONG_AWAKENING:
    case GI_MM_SONG_HEALING:
    case GI_MM_SONG_EPONA:
    case GI_MM_SONG_SOARING:
    case GI_MM_SONG_GORON_HALF:
    case GI_MM_SONG_GORON:
    case GI_MM_SONG_ZORA:
    case GI_MM_SONG_STORMS:
    case GI_MM_SONG_EMPTINESS:
    case GI_MM_SONG_ORDER:
    case GI_MM_SONG_SUN:
    case GI_MM_BOW:
    case GI_MM_QUIVER2:
    case GI_MM_QUIVER3:
    case GI_MM_OCARINA_FAIRY:
    case GI_MM_OCARINA_OF_TIME:
    case GI_MM_SWORD_KOKIRI:
    case GI_MM_SWORD_RAZOR:
    case GI_MM_SWORD_GILDED:
    case GI_MM_SHIELD_MIRROR:
    case GI_MM_PROGRESSIVE_SHIELD_HERO:
    case GI_MM_BOMB_BAG:
    case GI_MM_BOMB_BAG2:
    case GI_MM_BOMB_BAG3:
    case GI_MM_LENS:
    case GI_MM_ARROW_FIRE:
    case GI_MM_ARROW_ICE:
    case GI_MM_ARROW_LIGHT:
    case GI_MM_POWDER_KEG:
    case GI_MM_HOOKSHOT_SHORT:
    case GI_MM_HOOKSHOT:
    case GI_MM_PICTOGRAPH_BOX:
    case GI_MM_MAGIC_BEAN:
    case GI_MM_MOON_TEAR:
    case GI_MM_DEED_LAND:
    case GI_MM_DEED_SWAMP:
    case GI_MM_DEED_MOUNTAIN:
    case GI_MM_DEED_OCEAN:
    case GI_MM_ROOM_KEY:
    case GI_MM_LETTER_TO_KAFEI:
    case GI_MM_PENDANT_OF_MEMORIES:
    case GI_MM_LETTER_TO_MAMA:
    case GI_MM_WALLET:
    case GI_MM_WALLET2:
    case GI_MM_WALLET3:
    case GI_MM_WALLET4:
    case GI_MM_WALLET5:
    case GI_MM_GREAT_FAIRY_SWORD:
    case GI_MM_SPIN_UPGRADE:
    case GI_MM_BOMBER_NOTEBOOK:
    case GI_MM_DEFENSE_UPGRADE:
    case GI_MM_BOTTLE_CHATEAU:
    case GI_MM_OWL_GREAT_BAY:
    case GI_MM_OWL_ZORA_CAPE:
    case GI_MM_OWL_SNOWHEAD:
    case GI_MM_OWL_MOUNTAIN_VILLAGE:
    case GI_MM_OWL_CLOCK_TOWN:
    case GI_MM_OWL_MILK_ROAD:
    case GI_MM_OWL_WOODFALL:
    case GI_MM_OWL_SOUTHERN_SWAMP:
    case GI_MM_OWL_IKANA_CANYON:
    case GI_MM_OWL_STONE_TOWER:
    case GI_MM_SKELETON_KEY:
    case GI_MM_BUTTON_A:
    case GI_MM_BUTTON_C_RIGHT:
    case GI_MM_BUTTON_C_LEFT:
    case GI_MM_BUTTON_C_UP:
    case GI_MM_BUTTON_C_DOWN:
        return CSMC_MAJOR;
    case GI_MM_SMALL_KEY:
    case GI_MM_SMALL_KEY_WF:
    case GI_MM_SMALL_KEY_SH:
    case GI_MM_SMALL_KEY_GB:
    case GI_MM_SMALL_KEY_ST:
    case GI_MM_KEY_RING:
    case GI_MM_KEY_RING_WF:
    case GI_MM_KEY_RING_SH:
    case GI_MM_KEY_RING_GB:
    case GI_MM_KEY_RING_ST:
        return CSMC_KEY;
    case GI_MM_BOSS_KEY:
    case GI_MM_BOSS_KEY_WF:
    case GI_MM_BOSS_KEY_SH:
    case GI_MM_BOSS_KEY_GB:
    case GI_MM_BOSS_KEY_ST:
        return CSMC_BOSS_KEY;
    case GI_MM_GS_TOKEN:
    case GI_MM_GS_TOKEN_OCEAN:
    case GI_MM_GS_TOKEN_SWAMP:
        return CSMC_SPIDER;
    case GI_MM_STRAY_FAIRY:
    case GI_MM_STRAY_FAIRY_WF:
    case GI_MM_STRAY_FAIRY_SH:
    case GI_MM_STRAY_FAIRY_GB:
    case GI_MM_STRAY_FAIRY_ST:
    case GI_MM_STRAY_FAIRY_TOWN:
        return CSMC_FAIRY;
    case GI_MM_HEART_PIECE:
    case GI_MM_HEART_CONTAINER:
        return comboConfig(CFG_CSMC_HEARTS) ? CSMC_HEART : CSMC_NORMAL;
    case GI_MM_SOUL_OCTOROK:
    case GI_MM_SOUL_WALLMASTER:
    case GI_MM_SOUL_DODONGO:
    case GI_MM_SOUL_KEESE:
    case GI_MM_SOUL_TEKTITE:
    case GI_MM_SOUL_PEAHAT:
    case GI_MM_SOUL_LIZALFOS_DINALFOS:
    case GI_MM_SOUL_SKULLTULA:
    case GI_MM_SOUL_ARMOS:
    case GI_MM_SOUL_DEKU_BABA:
    case GI_MM_SOUL_DEKU_SCRUB:
    case GI_MM_SOUL_BUBBLE:
    case GI_MM_SOUL_BEAMOS:
    case GI_MM_SOUL_REDEAD_GIBDO:
    case GI_MM_SOUL_SKULLWALLTULA:
    case GI_MM_SOUL_SHELL_BLADE:
    case GI_MM_SOUL_LIKE_LIKE:
    case GI_MM_SOUL_IRON_KNUCKLE:
    case GI_MM_SOUL_FREEZARD:
    case GI_MM_SOUL_WOLFOS:
    case GI_MM_SOUL_GUAY:
    case GI_MM_SOUL_FLYING_POT:
    case GI_MM_SOUL_FLOORMASTER:
    case GI_MM_SOUL_CHUCHU:
    case GI_MM_SOUL_DEEP_PYTHON:
    case GI_MM_SOUL_SKULLFISH:
    case GI_MM_SOUL_DEXIHAND:
    case GI_MM_SOUL_DRAGONFLY:
    case GI_MM_SOUL_EENO:
    case GI_MM_SOUL_EYEGORE:
    case GI_MM_SOUL_HIPLOOP:
    case GI_MM_SOUL_REAL_BOMBCHU:
    case GI_MM_SOUL_TAKKURI:
    case GI_MM_SOUL_BOE:
    case GI_MM_SOUL_NEJIRON:
    case GI_MM_SOUL_BIO_BABA:
    case GI_MM_SOUL_GARO:
    case GI_MM_SOUL_WIZZROBE:
    case GI_MM_SOUL_GOMESS:
    case GI_MM_SOUL_GEKKO:
    case GI_MM_SOUL_BAD_BAT:
    case GI_MM_SOUL_SNAPPER:
    case GI_MM_SOUL_WART:
    case GI_MM_SOUL_CAPTAIN_KEETA:
    case GI_MM_SOUL_IGOS:
    case GI_MM_SOUL_ODOLWA:
    case GI_MM_SOUL_GOHT:
    case GI_MM_SOUL_GYORG:
    case GI_MM_SOUL_TWINMOLD:
    case GI_MM_SOUL_STALCHILD:
    case GI_MM_SOUL_LEEVER:
        return CSMC_SOUL;
    }
    return CSMC_NORMAL;
}

int csmcFromItem(s16 gi)
{
    if (gi < 0)
        gi = -gi;
#if defined(GAME_MM)
    gi ^= MASK_FOREIGN_GI;
#endif
    if (gi & MASK_FOREIGN_GI)
        return csmcFromItemMm(gi & ~MASK_FOREIGN_GI);
    else
        return csmcFromItemOot(gi);
}
