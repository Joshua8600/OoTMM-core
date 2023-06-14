#ifndef COMBO_NET_H
#define COMBO_NET_H

#include <combo/types.h>

#define NET_MAGIC 0x905AB56A

#define NET_OP_NOP       0x00
#define NET_OP_ITEM_RECV 0x01

typedef struct
{
    u8  player;
    u8  game;
    u16 key;
    s16 gi;
    s16 flags;
}
NetCmdItemRecv;

ALIGNED(4) typedef struct
{
    u8 op;
    u8 pad[3];
    union
    {
        NetCmdItemRecv itemRecv;
    };
}
NetCmd;

typedef struct
{
    u8*     uuid;
    u8      playerId;
    NetCmd  cmd;
}
NetContext;

typedef struct
{
    volatile u32            magic;
    volatile NetContext*    ctx;
    volatile u32            mutexSystem;
    volatile u32            mutexScript;
}
NetGlobal;

void        netInit(void);
NetContext* netMutexLock(void);
void        netMutexUnlock(void);
void        netClose(void);

#endif
