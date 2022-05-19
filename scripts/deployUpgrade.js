const { ethers } = require('hardhat');
const { readFileSync, writeFileSync } = require('fs');

async function deploy(name, ...params) {
  const Contract = await ethers.getContractFactory(name);
  return await Contract.deploy(...params).then(f => f.deployed());
}

async function deployUpgredeable(name, forwarderAddress) {
  const Contract = await ethers.getContractFactory(name);
  return await upgrades.deployProxy(Contract, {constructorArgs: [forwarderAddress], unsafeAllow: ["constructor"]}, {initializer: 'initialize'}).then(f => f.deployed());
}

async function deployUpgrade(upgradeName, proxyName, forwarderAddress) {
  const proxyAddress = JSON.parse(readFileSync('deploy.json'))[proxyName];
  const upgradeContract = await ethers.getContractFactory(upgradeName);
  return upgrades.upgradeProxy(proxyAddress, upgradeContract, {constructorArgs: [forwarderAddress], unsafeAllow: ["constructor"]}).then(f => f.deployed());
}

async function main() {
  //const forwarder = await deploy('MinimalForwarder');
  const proxyName = "ONEamericas"; //Original name of the project
  const ONEamericasV2 = await deployUpgrade("ONEpinoyV2", proxyName, MinimalForwarder.address); // Replace with Minimal Forwarder address

  const proxyAddress = JSON.parse(readFileSync('deploy.json'))[proxyName];
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log(`Updated: ${JSON.parse(readFileSync('deploy.json'))[proxyName]} with implementation: ${implementationAddress}`);
};
  
if (require.main === module) {
  main().then(() => process.exit(0))
    .catch(error => { console.error(error); process.exit(1); });
}