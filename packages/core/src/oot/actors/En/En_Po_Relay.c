#include <combo.h>

static int EnPoRelay_GetHeartPieceFlag(PlayState* play, int flag)
{
    /* Also spawn chest */
    SetRoomClear(play, 4);
    return Flags_GetCollectible(play, flag);
}

PATCH_CALL(0x80a7d008, EnPoRelay_GetHeartPieceFlag);
