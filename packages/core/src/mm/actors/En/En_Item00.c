#include <combo.h>
#include <combo/item.h>

void EnItem00_GiveItem(Actor_EnItem00* this, GameState_Play* play, s16 gi, float a, float b)
{
    ComboItemQuery q = ITEM_QUERY_INIT;
    Actor_Player* link;
    s16 itemId;

    q.gi = gi;
    link = GET_LINK(play);
    itemId = -1;
    switch (this->base.variable)
    {
    case 0x06:
        q.ovType = OV_COLLECTIBLE;
        q.sceneId = play->sceneId;
        q.id = this->collectibleFlag;
        q.ovFlags = OVF_PROGRESSIVE | OVF_DOWNGRADE;
        break;
    default:
        itemId = kExtendedGetItems[gi - 1].itemId;
        if (GetItemCollectBehavior(itemId) == 0xff)
            itemId = -1;
        break;
    }

    if (itemId >= 0)
    {
        this->base.attachedA = &link->base;
        AddItemWithIcon(play, link, &kExtendedGetItems[gi - 1]);
    }
    else
    {
        comboGiveItem(&this->base, play, &q, a, b);
    }
}

PATCH_CALL(0x800a700c, EnItem00_GiveItem);
PATCH_CALL(0x800a6a8c, EnItem00_GiveItem);

void EnItem00_DrawHeartPiece(Actor_EnItem00* this, GameState_Play* play)
{
    static const float scale = 12.5f;
    s16 gi;

    gi = comboOverride(OV_COLLECTIBLE, play->sceneId, this->collectibleFlag, GI_MM_HEART_PIECE);
    ModelViewScale(scale, scale, scale, MAT_MUL);
    comboDrawGI(play, &this->base, gi, 0);
}

PATCH_FUNC(0x800a75b8, EnItem00_DrawHeartPiece);
