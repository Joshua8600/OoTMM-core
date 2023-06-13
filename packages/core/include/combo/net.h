#ifndef COMBO_NET_H
#define COMBO_NET_H

#include <combo/types.h>

#define NET_MAGIC 0x905AB56A

typedef struct
{
    u8*     uuid;
    u8      playerId;
}
NetContext;

typedef struct
{
    volatile u32            magic;
    volatile NetContext*    ctx;
    volatile u8             mutexSystem;
    volatile u8             mutexScript;
}
NetGlobal;

void netInit(void);
void netMutexLock(void);
void netMutexUnlock(void);
void netClose(void);

#endif
