#ifndef _STATIC_INC_H
#define _STATIC_INC_H
#ifdef PRAGMA_ONCE
  #pragma once
#endif

#ifdef STATICALLY_LINKED
// This is for TFE?

//extern CDLLEntityClass CAcid_DLLClass;
//extern CDLLEntityClass CAirWave_DLLClass;
//extern CDLLEntityClass CAmmoItem_DLLClass;
//extern CDLLEntityClass CAmmoPack_DLLClass;
//extern CDLLEntityClass CAnimationChanger_DLLClass;
//extern CDLLEntityClass CAnimationHub_DLLClass;
//extern CDLLEntityClass CArmorItem_DLLClass;
//extern CDLLEntityClass CBackgroundViewer_DLLClass;
//extern CDLLEntityClass CBasicEffects_DLLClass;
//extern CDLLEntityClass CBeast_DLLClass;
//extern CDLLEntityClass CBigHead_DLLClass;
//extern CDLLEntityClass CBlendController_DLLClass;
//extern CDLLEntityClass CBloodSpray_DLLClass;
//extern CDLLEntityClass CBoneman_DLLClass;
//extern CDLLEntityClass CBouncer_DLLClass;
//extern CDLLEntityClass CBullet_DLLClass;
//extern CDLLEntityClass CCamera_DLLClass;
//extern CDLLEntityClass CCameraMarker_DLLClass;
//extern CDLLEntityClass CCannonBall_DLLClass;
//extern CDLLEntityClass CCatman_DLLClass;
//extern CDLLEntityClass CCopier_DLLClass;
//extern CDLLEntityClass CCounter_DLLClass;
//extern CDLLEntityClass CCrateRider_DLLClass;
//extern CDLLEntityClass CCyborgBike_DLLClass;
//extern CDLLEntityClass CCyborg_DLLClass;
//extern CDLLEntityClass CDamager_DLLClass;
//extern CDLLEntityClass CDebris_DLLClass;
//extern CDLLEntityClass CDestroyableArchitecture_DLLClass;
//extern CDLLEntityClass CDevil_DLLClass;
//extern CDLLEntityClass CDevilMarker_DLLClass;
//extern CDLLEntityClass CDevilProjectile_DLLClass;
//extern CDLLEntityClass CDoorController_DLLClass;
//extern CDLLEntityClass CDragonman_DLLClass;
//extern CDLLEntityClass CEffectMarker_DLLClass;
//extern CDLLEntityClass CEffector_DLLClass;
//extern CDLLEntityClass CElemental_DLLClass;
//extern CDLLEntityClass CEnemyBase_DLLClass;
//extern CDLLEntityClass CEnemyCounter_DLLClass;
//extern CDLLEntityClass CEnemyDive_DLLClass;
//extern CDLLEntityClass CEnemyFly_DLLClass;
//extern CDLLEntityClass CEnemyMarker_DLLClass;
//extern CDLLEntityClass CEnemyRunInto_DLLClass;
//extern CDLLEntityClass CEnemySpawner_DLLClass;
//extern CDLLEntityClass CEnvironmentBase_DLLClass;
//extern CDLLEntityClass CEnvironmentMarker_DLLClass;
//extern CDLLEntityClass CEruptor_DLLClass;
//extern CDLLEntityClass CEyeman_DLLClass;
//extern CDLLEntityClass CFish_DLLClass;
//extern CDLLEntityClass CFishman_DLLClass;
//extern CDLLEntityClass CFlame_DLLClass;
//extern CDLLEntityClass CFogMarker_DLLClass;
//extern CDLLEntityClass CGhostBusterRay_DLLClass;
//extern CDLLEntityClass CGizmo_DLLClass;
//extern CDLLEntityClass CGlobal_DLLClass;
//extern CDLLEntityClass CGradientMarker_DLLClass;
//extern CDLLEntityClass CGravityMarker_DLLClass;
//extern CDLLEntityClass CGravityRouter_DLLClass;
//extern CDLLEntityClass CHazeMarker_DLLClass;
//extern CDLLEntityClass CHeadman_DLLClass;
//extern CDLLEntityClass CHealthItem_DLLClass;
//extern CDLLEntityClass CHuanman_DLLClass;
//extern CDLLEntityClass CItem_DLLClass;
//extern CDLLEntityClass CKeyItem_DLLClass;
//extern CDLLEntityClass CLight_DLLClass;
//extern CDLLEntityClass CLightning_DLLClass;
//extern CDLLEntityClass CLightStyle_DLLClass;
//extern CDLLEntityClass CMamut_DLLClass;
//extern CDLLEntityClass CMamutman_DLLClass;
//extern CDLLEntityClass CMantaman_DLLClass;
//extern CDLLEntityClass CMarker_DLLClass;
//extern CDLLEntityClass CMessageHolder_DLLClass;
//extern CDLLEntityClass CMessageItem_DLLClass;
//extern CDLLEntityClass CMirrorMarker_DLLClass;
//extern CDLLEntityClass CModelDestruction_DLLClass;
//extern CDLLEntityClass CModelHolder2_DLLClass;
//extern CDLLEntityClass CModelHolder_DLLClass;
//extern CDLLEntityClass CMovingBrush_DLLClass;
//extern CDLLEntityClass CMovingBrushMarker_DLLClass;
//extern CDLLEntityClass CMusicChanger_DLLClass;
//extern CDLLEntityClass CMusicHolder_DLLClass;
//extern CDLLEntityClass CNavigationMarker_DLLClass;
//extern CDLLEntityClass CParticlesHolder_DLLClass;
//extern CDLLEntityClass CPendulum_DLLClass;
//extern CDLLEntityClass CPipebomb_DLLClass;
//extern CDLLEntityClass CPlayerActionMarker_DLLClass;
//extern CDLLEntityClass CPlayerAnimator_DLLClass;
#include <Engine/Entities/EntityProperties.h>
extern bool _reg_CPlayer;
extern CDLLEntityClass CPlayer_DLLClass;
bool _reg1 = Registry::insert("CPlayer_DLLClass", (void*)&CPlayer_DLLClass);
//#include <Entities/Player_tables.h>
//extern CDLLEntityClass CPlayer_DLLClass;
//extern CDLLEntityClass CPlayerMarker_DLLClass;
//extern CDLLEntityClass CPlayerView_DLLClass;
//extern CDLLEntityClass CPlayerWeaponsEffects_DLLClass;
//extern CDLLEntityClass CPlayerWeapons_DLLClass;
//extern CDLLEntityClass CProjectile_DLLClass;
//extern CDLLEntityClass CPyramidSpaceShip_DLLClass;
//extern CDLLEntityClass CPyramidSpaceShipMarker_DLLClass;
//extern CDLLEntityClass CReminder_DLLClass;
//extern CDLLEntityClass CRobotDriving_DLLClass;
//extern CDLLEntityClass CRobotFixed_DLLClass;
//extern CDLLEntityClass CRobotFlying_DLLClass;
//extern CDLLEntityClass CRollingStone_DLLClass;
//extern CDLLEntityClass CScorpman_DLLClass;
//extern CDLLEntityClass CShip_DLLClass;
//extern CDLLEntityClass CShipMarker_DLLClass;
//extern CDLLEntityClass CSoundHolder_DLLClass;
//extern CDLLEntityClass CStormController_DLLClass;
//extern CDLLEntityClass CSwitch_DLLClass;
//extern CDLLEntityClass CTeleport_DLLClass;
//extern CDLLEntityClass CTouchField_DLLClass;
//extern CDLLEntityClass CTrigger_DLLClass;
//extern CDLLEntityClass CTwister_DLLClass;
//extern CDLLEntityClass CVoiceHolder_DLLClass;
//extern CDLLEntityClass CWalker_DLLClass;
//extern CDLLEntityClass CWatcher_DLLClass;
//extern CDLLEntityClass CWatchPlayers_DLLClass;
//extern CDLLEntityClass CWater_DLLClass;
//extern CDLLEntityClass CWeaponItem_DLLClass;
//extern CDLLEntityClass CWerebull_DLLClass;
//extern CDLLEntityClass CWoman_DLLClass;
//extern CDLLEntityClass CWorldBase_DLLClass;
//extern CDLLEntityClass CWorldLink_DLLClass;
//extern CDLLEntityClass CWorldSettingsController_DLLClass;

extern "C" CGame* GAME_Create(void);
void static_setup() {
  //CDLLEntityClass* CPlayer_DLLClassP  = &CPlayer_DLLClass;
  // CDLLEntityClass* CAcid_DLLClassP = &CAcid_DLLClass;
  // CDLLEntityClass* CAirWave_DLLClassP = &CAirWave_DLLClass;
  // CDLLEntityClass* CAmmoItem_DLLClassP = &CAmmoItem_DLLClass;
  // CDLLEntityClass* CAmmoPack_DLLClassP = &CAmmoPack_DLLClass;
  // CDLLEntityClass* CAnimationChanger_DLLClassP = &CAnimationChanger_DLLClass;
  // CDLLEntityClass* CAnimationHub_DLLClassP = &CAnimationHub_DLLClass;
  // CDLLEntityClass* CArmorItem_DLLClassP = &CArmorItem_DLLClass;
  // CDLLEntityClass* CBackgroundViewer_DLLClassP = &CBackgroundViewer_DLLClass;
  // //CDLLEntityClass* CBasicEffects_DLLClassP = &CBasicEffects_DLLClass;
  // CDLLEntityClass* CBeast_DLLClassP = &CBeast_DLLClass;
  // CDLLEntityClass* CBigHead_DLLClassP = &CBigHead_DLLClass;
  // CDLLEntityClass* CBlendController_DLLClassP = &CBlendController_DLLClass;
  // CDLLEntityClass* CBloodSpray_DLLClassP = &CBloodSpray_DLLClass;
  // CDLLEntityClass* CBoneman_DLLClassP = &CBoneman_DLLClass;
  // CDLLEntityClass* CBouncer_DLLClassP = &CBouncer_DLLClass;
  // CDLLEntityClass* CBullet_DLLClassP = &CBullet_DLLClass;
  // CDLLEntityClass* CCamera_DLLClassP = &CCamera_DLLClass;
  // CDLLEntityClass* CCameraMarker_DLLClassP = &CCameraMarker_DLLClass;
  // CDLLEntityClass* CCannonBall_DLLClassP = &CCannonBall_DLLClass;
  // CDLLEntityClass* CCatman_DLLClassP = &CCatman_DLLClass;
  // CDLLEntityClass* CCopier_DLLClassP = &CCopier_DLLClass;
  // CDLLEntityClass* CCounter_DLLClassP = &CCounter_DLLClass;
  // CDLLEntityClass* CCrateRider_DLLClassP = &CCrateRider_DLLClass;
  // CDLLEntityClass* CCyborgBike_DLLClassP = &CCyborgBike_DLLClass;
  // CDLLEntityClass* CCyborg_DLLClassP = &CCyborg_DLLClass;
  // CDLLEntityClass* CDamager_DLLClassP = &CDamager_DLLClass;
  // CDLLEntityClass* CDebris_DLLClassP = &CDebris_DLLClass;
  // CDLLEntityClass* CDestroyableArchitecture_DLLClassP = &CDestroyableArchitecture_DLLClass;
  // CDLLEntityClass* CDevil_DLLClassP = &CDevil_DLLClass;
  // CDLLEntityClass* CDevilMarker_DLLClassP = &CDevilMarker_DLLClass;
  // CDLLEntityClass* CDevilProjectile_DLLClassP = &CDevilProjectile_DLLClass;
  // CDLLEntityClass* CDoorController_DLLClassP = &CDoorController_DLLClass;
  // CDLLEntityClass* CDragonman_DLLClassP = &CDragonman_DLLClass;
  // CDLLEntityClass* CEffectMarker_DLLClassP = &CEffectMarker_DLLClass;
  // CDLLEntityClass* CEffector_DLLClassP = &CEffector_DLLClass;
  // CDLLEntityClass* CElemental_DLLClassP = &CElemental_DLLClass;
  // CDLLEntityClass* CEnemyBase_DLLClassP = &CEnemyBase_DLLClass;
  // CDLLEntityClass* CEnemyCounter_DLLClassP = &CEnemyCounter_DLLClass;
  // CDLLEntityClass* CEnemyDive_DLLClassP = &CEnemyDive_DLLClass;
  // CDLLEntityClass* CEnemyFly_DLLClassP = &CEnemyFly_DLLClass;
  // CDLLEntityClass* CEnemyMarker_DLLClassP = &CEnemyMarker_DLLClass;
  // CDLLEntityClass* CEnemyRunInto_DLLClassP = &CEnemyRunInto_DLLClass;
  // CDLLEntityClass* CEnemySpawner_DLLClassP = &CEnemySpawner_DLLClass;
  // CDLLEntityClass* CEnvironmentBase_DLLClassP = &CEnvironmentBase_DLLClass;
  // CDLLEntityClass* CEnvironmentMarker_DLLClassP = &CEnvironmentMarker_DLLClass;
  // CDLLEntityClass* CEruptor_DLLClassP = &CEruptor_DLLClass;
  // CDLLEntityClass* CEyeman_DLLClassP = &CEyeman_DLLClass;
  // CDLLEntityClass* CFish_DLLClassP = &CFish_DLLClass;
  // CDLLEntityClass* CFishman_DLLClassP = &CFishman_DLLClass;
  // CDLLEntityClass* CFlame_DLLClassP = &CFlame_DLLClass;
  // CDLLEntityClass* CFogMarker_DLLClassP = &CFogMarker_DLLClass;
  // //CDLLEntityClass* CGhostBusterRay_DLLClassP = &CGhostBusterRay_DLLClass;
  // CDLLEntityClass* CGizmo_DLLClassP = &CGizmo_DLLClass;
  // //CDLLEntityClass* CGlobal_DLLClassP = &CGlobal_DLLClass;
  // CDLLEntityClass* CGradientMarker_DLLClassP = &CGradientMarker_DLLClass;
  // CDLLEntityClass* CGravityMarker_DLLClassP = &CGravityMarker_DLLClass;
  // CDLLEntityClass* CGravityRouter_DLLClassP = &CGravityRouter_DLLClass;
  // CDLLEntityClass* CHazeMarker_DLLClassP = &CHazeMarker_DLLClass;
  // CDLLEntityClass* CHeadman_DLLClassP = &CHeadman_DLLClass;
  // CDLLEntityClass* CHealthItem_DLLClassP = &CHealthItem_DLLClass;
  // CDLLEntityClass* CHuanman_DLLClassP = &CHuanman_DLLClass;
  // CDLLEntityClass* CItem_DLLClassP = &CItem_DLLClass;
  // CDLLEntityClass* CKeyItem_DLLClassP = &CKeyItem_DLLClass;
  // CDLLEntityClass* CLight_DLLClassP = &CLight_DLLClass;
  // CDLLEntityClass* CLightning_DLLClassP = &CLightning_DLLClass;
  // CDLLEntityClass* CLightStyle_DLLClassP = &CLightStyle_DLLClass;
  // CDLLEntityClass* CMamut_DLLClassP = &CMamut_DLLClass;
  // CDLLEntityClass* CMamutman_DLLClassP = &CMamutman_DLLClass;
  // CDLLEntityClass* CMantaman_DLLClassP = &CMantaman_DLLClass;
  // CDLLEntityClass* CMarker_DLLClassP = &CMarker_DLLClass;
  // CDLLEntityClass* CMessageHolder_DLLClassP = &CMessageHolder_DLLClass;
  // CDLLEntityClass* CMessageItem_DLLClassP = &CMessageItem_DLLClass;
  // CDLLEntityClass* CMirrorMarker_DLLClassP = &CMirrorMarker_DLLClass;
  // CDLLEntityClass* CModelDestruction_DLLClassP = &CModelDestruction_DLLClass;
  // CDLLEntityClass* CModelHolder2_DLLClassP = &CModelHolder2_DLLClass;
  // CDLLEntityClass* CModelHolder_DLLClassP = &CModelHolder_DLLClass;
  // CDLLEntityClass* CMovingBrush_DLLClassP = &CMovingBrush_DLLClass;
  // CDLLEntityClass* CMovingBrushMarker_DLLClassP = &CMovingBrushMarker_DLLClass;
  // CDLLEntityClass* CMusicChanger_DLLClassP = &CMusicChanger_DLLClass;
  // CDLLEntityClass* CMusicHolder_DLLClassP = &CMusicHolder_DLLClass;
  // CDLLEntityClass* CNavigationMarker_DLLClassP = &CNavigationMarker_DLLClass;
  // CDLLEntityClass* CParticlesHolder_DLLClassP = &CParticlesHolder_DLLClass;
  // CDLLEntityClass* CPendulum_DLLClassP = &CPendulum_DLLClass;
  // CDLLEntityClass* CPipebomb_DLLClassP = &CPipebomb_DLLClass;
  // CDLLEntityClass* CPlayerActionMarker_DLLClassP = &CPlayerActionMarker_DLLClass;
  // CDLLEntityClass* CPlayerAnimator_DLLClassP = &CPlayerAnimator_DLLClass;
   CDLLEntityClass* CPlayer_DLLClassP = &CPlayer_DLLClass;
  // CDLLEntityClass* CPlayerMarker_DLLClassP = &CPlayerMarker_DLLClass;
  // CDLLEntityClass* CPlayerView_DLLClassP = &CPlayerView_DLLClass;
  // CDLLEntityClass* CPlayerWeaponsEffects_DLLClassP = &CPlayerWeaponsEffects_DLLClass;
  // CDLLEntityClass* CPlayerWeapons_DLLClassP = &CPlayerWeapons_DLLClass;
  // CDLLEntityClass* CProjectile_DLLClassP = &CProjectile_DLLClass;
  // CDLLEntityClass* CPyramidSpaceShip_DLLClassP = &CPyramidSpaceShip_DLLClass;
  // CDLLEntityClass* CPyramidSpaceShipMarker_DLLClassP = &CPyramidSpaceShipMarker_DLLClass;
  // CDLLEntityClass* CReminder_DLLClassP = &CReminder_DLLClass;
  // CDLLEntityClass* CRobotDriving_DLLClassP = &CRobotDriving_DLLClass;
  // CDLLEntityClass* CRobotFixed_DLLClassP = &CRobotFixed_DLLClass;
  // CDLLEntityClass* CRobotFlying_DLLClassP = &CRobotFlying_DLLClass;
  // CDLLEntityClass* CRollingStone_DLLClassP = &CRollingStone_DLLClass;
  // CDLLEntityClass* CScorpman_DLLClassP = &CScorpman_DLLClass;
  // CDLLEntityClass* CShip_DLLClassP = &CShip_DLLClass;
  // CDLLEntityClass* CShipMarker_DLLClassP = &CShipMarker_DLLClass;
  // CDLLEntityClass* CSoundHolder_DLLClassP = &CSoundHolder_DLLClass;
  // CDLLEntityClass* CStormController_DLLClassP = &CStormController_DLLClass;
  // CDLLEntityClass* CSwitch_DLLClassP = &CSwitch_DLLClass;
  // CDLLEntityClass* CTeleport_DLLClassP = &CTeleport_DLLClass;
  // CDLLEntityClass* CTouchField_DLLClassP = &CTouchField_DLLClass;
  // CDLLEntityClass* CTrigger_DLLClassP = &CTrigger_DLLClass;
  // CDLLEntityClass* CTwister_DLLClassP = &CTwister_DLLClass;
  // CDLLEntityClass* CVoiceHolder_DLLClassP = &CVoiceHolder_DLLClass;
  // CDLLEntityClass* CWalker_DLLClassP = &CWalker_DLLClass;
  // CDLLEntityClass* CWatcher_DLLClassP = &CWatcher_DLLClass;
  // CDLLEntityClass* CWatchPlayers_DLLClassP = &CWatchPlayers_DLLClass;
  // CDLLEntityClass* CWater_DLLClassP = &CWater_DLLClass;
  // CDLLEntityClass* CWeaponItem_DLLClassP = &CWeaponItem_DLLClass;
  // CDLLEntityClass* CWerebull_DLLClassP = &CWerebull_DLLClass;
  // CDLLEntityClass* CWoman_DLLClassP = &CWoman_DLLClass;
  // CDLLEntityClass* CWorldBase_DLLClassP = &CWorldBase_DLLClass;
  // CDLLEntityClass* CWorldLink_DLLClassP = &CWorldLink_DLLClass;
  // CDLLEntityClass* CWorldSettingsController_DLLClassP = &CWorldSettingsController_DLLClass;

  CGame* (*GAME_CreateP)(void) = &GAME_Create;
}

#endif

#endif
