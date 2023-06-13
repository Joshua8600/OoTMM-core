#include <combo.h>
#include <combo/net.h>

#define gNetGlobal (*((NetGlobal*)(0x800001a0)))

NetContext gNetCtx;

void netInit(void)
{
    /* Init the context */
    gNetCtx.uuid = gComboData.uuid;
    gNetCtx.playerId = gComboData.playerId;

    /* Init the global struct */
    gNetGlobal.ctx = 0;
    gNetGlobal.mutexSystem = 0;
    gNetGlobal.mutexScript = 0;
    gNetGlobal.magic = NET_MAGIC;
}

void netMutexLock(void)
{
    /* Preemptive lock */
    gNetGlobal.mutexSystem = 1;

    /* Check for concurrent lock */
    if (!gNetGlobal.mutexScript)
        return;

    /* The mutex is alrady locked */
    gNetGlobal.mutexSystem = 0;

    /* Wait for the mutex to be unlocked */
    while (gNetGlobal.mutexScript)
        ;

    /* Lock the mutex */
    netMutexLock();
}

void netMutexUnlock(void)
{
    gNetGlobal.mutexSystem = 0;
}

void netClose(void)
{
    netMutexLock();
    gNetGlobal.magic = 0;
    netMutexUnlock();
}
