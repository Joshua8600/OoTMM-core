#include <combo.h>
#include <combo/xflags.h>
#include <combo/item.h>
#include <combo/csmc.h>
#include <combo/config.h>
#include <combo/actor.h>

Actor_ObjGrass* gObjGrass;

static void ObjGrass_GetID(int* dstPackId, int* dstBushId, Actor_ObjGrass_PackBush* bush)
{
    u32 offset;
    u32 offsetPack;
    u32 offsetBush;
    int packId;
    int bushId;

    /* Extract the pack ID */
    offset = (u32)bush - (u32)gObjGrass;
    offsetPack = (offset - offsetof(Actor_ObjGrass_Pack, bushes) - offsetof(Actor_ObjGrass, packs));
    packId = offsetPack / sizeof(Actor_ObjGrass_Pack);

    /* Extract the bush ID */
    offset = (u32)bush - ((u32)&gObjGrass->packs[packId]);
    offsetBush = offset - offsetof(Actor_ObjGrass_Pack, bushes);
    bushId = offsetBush / sizeof(Actor_ObjGrass_PackBush);

    /* Store the IDs */
    *dstPackId = packId;
    *dstBushId = bushId;
}

void ObjGrass_GetXflag(Xflag* xflag, Actor_ObjGrass_PackBush* bush)
{
    int packId;
    int bushId;

    ObjGrass_GetID(&packId, &bushId, bush);
    memcpy(xflag, &gObjGrass->xflags[packId], sizeof(Xflag));
    xflag->sliceId = bushId;
}

void ObjGrass_SpawnBushDropWrapper(Actor_ObjGrass_PackBush* bush, PlayState* play)
{
    Xflag xflag;

    if (Config_Flag(CFG_MM_SHUFFLE_GRASS))
    {
        /* Extract the ID and build the xflag */
        ObjGrass_GetXflag(&xflag, bush);

        /* Check if the reward was already collected */
        if (!comboXflagsGet(&xflag))
        {
            EnItem00_DropCustom(play, &bush->position, &xflag);
            return;
        }
    }

    /* Forward */
    void (*ObjGrass_SpawnBushDrop)(Actor_ObjGrass_PackBush*, PlayState*);
    ObjGrass_SpawnBushDrop = actorAddr(ACTOR_OBJ_GRASS, 0x809a92d0);
    ObjGrass_SpawnBushDrop(bush, play);
}

void ObjGrass_DrawBush(Actor_ObjGrass_PackBush* bush)
{
    Xflag xflag;
    void* dlist;
    ComboItemOverride o;

    o.gi = 0;
    if (Config_Flag(CFG_MM_SHUFFLE_GRASS))
    {
        /* Extract the ID and build the xflag */
        ObjGrass_GetXflag(&xflag, bush);

        /* Check if the reward was already collected */
        if (!comboXflagsGet(&xflag))
            comboXflagItemOverride(&o, &xflag, 0);
    }

    /* Prepare the draw */
    csmcGrassPreDraw(gPlay, o.gi, CSMC_GRASS_NORMAL, 0, 1);
    dlist = actorAddr(ACTOR_OBJ_GRASS, 0x809aaae0);

    /* Draw */
    OPEN_DISPS(gPlay->state.gfxCtx);
    gSPMatrix(POLY_OPA_DISP++, Matrix_Finalize(gPlay->state.gfxCtx), G_MTX_NOPUSH | G_MTX_LOAD | G_MTX_MODELVIEW);
    gSPDisplayList(POLY_OPA_DISP++, (u32)dlist & 0xffffff);
    CLOSE_DISPS();
}
