const { ethers } = require('hardhat');
const { writeFileSync } = require('fs');

async function deploy(name, ...params) {
  const Contract = await ethers.getContractFactory(name);
  return await Contract.deploy(...params).then(f => f.deployed());
}

async function deployUpgredeable(name, forwarderAddress) {
  const Contract = await ethers.getContractFactory(name);
  return await upgrades.deployProxy(Contract, {constructorArgs: [forwarderAddress], unsafeAllow: ["constructor"]}, {initializer: 'initialize'}).then(f => f.deployed());
}

async function main() {
  const forwarder = await deploy('MinimalForwarder');
  const ONEamericasUpgredeable = await deployUpgredeable("ONEpinoy", forwarder.address);
    
  writeFileSync('deploy.json', JSON.stringify({
    MinimalForwarder: forwarder.address,
    ONEamericas: ONEamericasUpgredeable.address,
  }, null, 2));

  console.log(`MinimalForwarder: ${forwarder.address}\ONEpinoy: ${ONEamericasUpgredeable.address}`);
};
  
if (require.main === module) {
  main().then(() => process.exit(0))
    .catch(error => { console.error(error); process.exit(1); });
}