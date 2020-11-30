#ifndef _GFX_WRAPPER_OPEN_GL_H
#define _GFX_WRAPPER_OPEN_GL_H

#include "Engine/StdH.h"

#include <Engine/Graphics/GfxLibrary.h>
#include <Engine/Graphics/GfxProfile.h>
#include <Engine/Base/Statistics_Internal.h>


extern "C" {
  void ogl_EnableDepthWrite(void);
  void ogl_EnableDepthBias(void);
  void ogl_EnableDepthTest(void);
  void ogl_EnableAlphaTest(void);
  void ogl_EnableBlend(void);
  void ogl_EnableDither(void);
  void ogl_EnableTexture(void);
  void ogl_EnableClipping(void);
  void ogl_EnableClipPlane(void);
  void ogl_DisableDepthWrite(void);
  void ogl_DisableDepthBias(void);
  void ogl_DisableDepthTest(void);
  void ogl_DisableAlphaTest(void);
  void ogl_DisableBlend(void);
  void ogl_DisableDither(void);
  void ogl_DisableTexture(void);
  void ogl_DisableClipping(void);
  void ogl_DisableClipPlane(void);
  void ogl_BlendFunc( GfxBlend eSrc, GfxBlend eDst);
  void ogl_DepthFunc( GfxComp eFunc);
  void ogl_DepthRange( FLOAT fMin, FLOAT fMax);
  void ogl_CullFace(  GfxFace eFace);
  void ogl_FrontFace( GfxFace eFace);
  void ogl_ClipPlane( const DOUBLE *pdPlane);
  void ogl_SetOrtho( const FLOAT fLeft, const FLOAT fRight, const FLOAT fTop,  const FLOAT fBottom, const FLOAT fNear, const FLOAT fFar, const BOOL bSubPixelAdjust);
  void ogl_SetFrustum( const FLOAT fLeft, const FLOAT fRight, const FLOAT fTop,  const FLOAT fBottom, const FLOAT fNear, const FLOAT fFar);
  void ogl_SetTextureMatrix( const FLOAT *pfMatrix);
  void ogl_SetViewMatrix( const FLOAT *pfMatrix);
  void ogl_PolygonMode( GfxPolyMode ePolyMode);
  void ogl_SetTextureWrapping( enum GfxWrap eWrapU, enum GfxWrap eWrapV);
  void ogl_SetTextureModulation( INDEX iScale);
  void ogl_GenerateTexture( ULONG &ulTexObject);
  void ogl_DeleteTexture( ULONG &ulTexObject);
  void ogl_SetVertexArray( GFXVertex4 *pvtx, INDEX ctVtx);
  void ogl_SetNormalArray( GFXNormal *pnor);
  void ogl_SetTexCoordArray( GFXTexCoord *ptex, BOOL b4);
  void ogl_SetColorArray( GFXColor *pcol);
  void ogl_DrawElements( INDEX ctElem, INDEX_T *pidx);
  void ogl_SetConstantColor(COLOR col);
  void ogl_EnableColorArray(void);
  void ogl_DisableColorArray(void);
  void ogl_Finish(void);
  void ogl_LockArrays(void);
  void ogl_EnableTruform( void);
  void ogl_DisableTruform(void);
  void ogl_SetColorMask( ULONG ulColorMask); 
};


#endif