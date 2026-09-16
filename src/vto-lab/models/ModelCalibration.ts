import { CalibrationEntry } from '../calibration/calibrationRegistry';

export function parseOpticalFrameWidthMm(frameSize:string):number|null {
  if(!frameSize)return null;
  const clean=frameSize.replace(/[\u25A1\u2B1C\u2610\u25FB\u25FC\u25FD\u25FE\s]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
  const parts=clean.split('-').map(Number);
  if(parts.length<2||parts.slice(0,2).some(v=>!Number.isFinite(v)||v<=0))return null;
  return parts[0]*2+parts[1];
}

export function calculateModelScale(frameSize:string,nativeModelWidth:number,calibration:CalibrationEntry){
  void frameSize;
  const physicalWidthMm=calibration.physicalDimensions.frameWidthMm??0;
  // Current production VTO is calibrated manually in admin. The persisted
  // manual transform is authoritative and must not depend on optional optical
  // measurements or a legacy metadata-source string.
  if(calibration.manualTransform?.scale>0){
    return { scale:calibration.manualTransform.scale, physicalWidthCm:physicalWidthMm/10, physicalWidthMm };
  }
  if(!physicalWidthMm||physicalWidthMm<=0||nativeModelWidth<=0)return{scale:0,physicalWidthCm:0,physicalWidthMm:0};
  const physicalWidthCm=physicalWidthMm/10;
  return{scale:(physicalWidthCm/nativeModelWidth)*calibration.widthMultiplier,physicalWidthCm,physicalWidthMm};
}
