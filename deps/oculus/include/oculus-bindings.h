#ifndef _OCULUS_BINDINGS_H_
#define _OCULUS_BINDINGS_H_

#include <v8.h>
#include <nan.h>

using namespace v8;

/// inline IVRSystem *VR_Init( EVRInitError *peError, EVRApplicationType eApplicationType );
NAN_METHOD(Oculus_Init);

Local<Object> makeOculusVr();

#endif
