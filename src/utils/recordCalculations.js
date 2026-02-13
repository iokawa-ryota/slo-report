const calcProb = (games, count) => (count > 0 ? (games / count).toFixed(1) : '-');

export const calculateInputStats = ({ formData, isMidStart, calcMode, detailFields }) => {
  const gEnd = Number(formData.totalGames) || 0;
  const bEnd = Number(formData.bigCount) || 0;
  const rEnd = Number(formData.regCount) || 0;
  const gStart = isMidStart ? Number(formData.startTotalGames || 0) : 0;
  const bStart = isMidStart ? Number(formData.startBigCount || 0) : 0;
  const rStart = isMidStart ? Number(formData.startRegCount || 0) : 0;
  const myGames = Math.max(0, gEnd - gStart);
  const myBig = Math.max(0, bEnd - bStart);
  const myReg = Math.max(0, rEnd - rStart);

  let accuracy = null;
  if (calcMode === 'simple') {
    const misses = Number(formData.techMissCount || 0);
    const attempts = Number(formData.techAttemptCount || 0);
    if (attempts > 0) accuracy = (((attempts - misses) / attempts) * 100).toFixed(1);
  } else {
    const midS = detailFields.mid ? Number(formData.midSuccess || 0) : 0;
    const midM = detailFields.mid ? Number(formData.midMiss || 0) : 0;
    const rightS = detailFields.right ? Number(formData.rightSuccess || 0) : 0;
    const rightM = detailFields.right ? Number(formData.rightMiss || 0) : 0;
    const requiredAttempts = midS + midM + rightS + rightM;
    if (requiredAttempts > 0) {
      accuracy = (((midS + rightS) / requiredAttempts) * 100).toFixed(1);
    }
  }

  return {
    personal: {
      games: myGames,
      big: myBig,
      reg: myReg,
      bigProb: calcProb(myGames, myBig),
      regProb: calcProb(myGames, myReg),
      combinedProb: calcProb(myGames, myBig + myReg),
      techAccuracy: accuracy
    }
  };
};

export const calculateLoss = ({ formData, calcMode, currentConfig, detailFields }) => {
  let techLoss = 0;
  let totalMisses = 0;

  if (calcMode === 'simple') {
    totalMisses = Number(formData.techMissCount || 0);
    techLoss = totalMisses * currentConfig.techLossPerMiss;
  } else if (calcMode === 'detail') {
    const midMiss = detailFields.mid ? Number(formData.midMiss || 0) : 0;
    const rightMiss = detailFields.right ? Number(formData.rightMiss || 0) : 0;
    totalMisses = midMiss + rightMiss;
    techLoss = totalMisses * currentConfig.techLossPerMiss;
  }

  const wmLoss = Number(formData.watermelonLossCount || 0) * currentConfig.watermelonLoss;
  const chLoss = Number(formData.cherryLossCount || 0) * currentConfig.cherryLoss;
  return {
    total: techLoss + wmLoss + chLoss + Number(formData.otherLossCount || 0),
    misses: totalMisses
  };
};
