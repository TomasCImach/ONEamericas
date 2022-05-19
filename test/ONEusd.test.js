// Load dependencies
const { expect } = require('chai');
const { Wallet, BigNumber, utils } = require('ethers');
const { parseEther } = require('ethers/lib/utils');
const { signMetaTxRequest } = require("../src/signer");

describe('ONE US Dollar', function () {
    async function deployUpgredeable(name, args) {
        const _Contract = await ethers.getContractFactory(name);
        return await upgrades.deployProxy(_Contract,args, {initializer: 'initialize'}).then(f => f.deployed());
    }
    async function deploy(name, ...params) {
        const Contract = await ethers.getContractFactory(name);
        return await Contract.deploy(...params).then(f => f.deployed());
    }

    let ONEusdContract;
    let forwarderContract;
    let ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        forwarderContract = await deploy('MinimalForwarder');
        ONEusdContract = await deploy('ONEUSDollar', forwarderContract.address);
    });

    it('Token Attributes (name, symbol, decimals)', async function () {
        //Verifying the name of the token
        expect(await ONEusdContract.name()).to.equal('ONE US Dollar');
        //Verifying the symbol of the token
        expect(await ONEusdContract.symbol()).to.equal('ONEUSD');
        //Verifying the decimals of the token.
        expect(await ONEusdContract.decimals()).to.equal(18);
    });

    it('Pause and unpause', async function () {
        // configureMinter and allowMinter for 1000 ether
        await ONEusdContract.configureMinter(addr1.address, parseEther('1000'));
        expect(await ONEusdContract.minterAllowance(addr1.address)).to.equal(parseEther('1000'));

        // Minting 500 ether to addr1
        await ONEusdContract.connect(addr1).mint(addr1.address, parseEther('500'));
        expect(await ONEusdContract.balanceOf(addr1.address)).to.equal(parseEther('500'));

        // Pause the contract
        await ONEusdContract.pause();

        // try to mint
        try{
            await ONEusdContract.connect(addr1).mint(addr1.address, parseEther('100'));
        }catch(e){
            expect(e.message).to.contain('Pausable: paused');
        }

        // try to transfer
        try{
            await ONEusdContract.connect(addr1).transfer(addr2.address, parseEther('100'));
        }catch(e){
            expect(e.message).to.contain('Pausable: paused');
        }

        expect(await ONEusdContract.balanceOf(addr1.address)).to.equal(parseEther('500'));

        // Unpause the contract
        await ONEusdContract.unpause();

        // try to mint
        await ONEusdContract.connect(addr1).mint(addr1.address, parseEther('100'));
        // try to transfer
        await ONEusdContract.connect(addr1).transfer(addr2.address, parseEther('200'));
        // try to approve
        await ONEusdContract.connect(addr1).approve(addr2.address, parseEther('300'));

        expect(await ONEusdContract.balanceOf(addr1.address)).to.equal(parseEther('400'));
        expect(await ONEusdContract.allowance(addr1.address, addr2.address)).to.equal(parseEther('300'));
    });

    it('Bulk transfer', async function () {
        // configureMinter and allowMinter for 1000 ether
        await ONEusdContract.configureMinter(addr1.address, parseEther('1000'));
        expect(await ONEusdContract.minterAllowance(addr1.address)).to.equal(parseEther('1000'));

        // Minting 500 ether to addr1
        await ONEusdContract.connect(addr1).mint(addr1.address, parseEther('500'));
        expect(await ONEusdContract.balanceOf(addr1.address)).to.equal(parseEther('500'));

        // Bulk transfer
        await ONEusdContract.connect(addr1).bulkTransfer([addr2.address, addr3.address], [parseEther('100'), parseEther('150')]);
        expect(await ONEusdContract.balanceOf(addr1.address)).to.equal(parseEther('250'));
        expect(await ONEusdContract.balanceOf(addr2.address)).to.equal(parseEther('100'));
        expect(await ONEusdContract.balanceOf(addr3.address)).to.equal(parseEther('150'));
    });

    it('ConfigureMinter, mint, mintTo', async function () {
        // configureMinter and allowMinter for 1000 ether
        await ONEusdContract.configureMinter(addr1.address, parseEther('1000'));
        expect(await ONEusdContract.minterAllowance(addr1.address)).to.equal(parseEther('1000'));

        // Minting 500 ether to addr1
        await ONEusdContract.connect(addr1).mint(addr1.address, parseEther('500'));
        expect(await ONEusdContract.balanceOf(addr1.address)).to.equal(parseEther('500'));

        // Minting 400 ether to addr2
        await ONEusdContract.connect(addr1).mint(addr2.address, parseEther('400'));
        expect(await ONEusdContract.balanceOf(addr2.address)).to.equal(parseEther('400'));
    });

    it('ConfigureMinter, increaseMinterAllowance, decreaseMinterAllowance', async function () {
        // configureMinter and allowMinter for 1000 ether
        await ONEusdContract.configureMinter(addr1.address, parseEther('1000'));
        expect(await ONEusdContract.minterAllowance(addr1.address)).to.equal(parseEther('1000'));

        // Increase minter allowance for addr1 200 ether
        await ONEusdContract.increaseMinterAllowance(addr1.address, parseEther('200'));
        expect(await ONEusdContract.minterAllowance(addr1.address)).to.equal(parseEther('1200'));

        // Decrease minter allowance for addr1 100 ether
        await ONEusdContract.decreaseMinterAllowance(addr1.address, parseEther('100'));
        expect(await ONEusdContract.minterAllowance(addr1.address)).to.equal(parseEther('1100'));

        // Mint 1100 ether to addr1
        await ONEusdContract.connect(addr1).mint(addr1.address, parseEther('1100'));
        expect(await ONEusdContract.balanceOf(addr1.address)).to.equal(parseEther('1100'));
        expect(await ONEusdContract.minterAllowance(addr1.address)).to.equal(parseEther('0'));
    });

    it('IncreaseMinterAllowance, decreaseMinterAllowance to non minter', async function () {
        // Increase minter allowance for addr1 200 ether
        try{
            await ONEusdContract.increaseMinterAllowance(addr1.address, parseEther('200'));
        }catch(e){
            expect(e.message).to.contain('Minter not configured');
        }

        // Decrease minter allowance for addr1 200 ether
        try{
            await ONEusdContract.decreaseMinterAllowance(addr1.address, parseEther('200'));
        }catch(e){
            expect(e.message).to.contain('Minter not configured');
        }
    });

    it('DecreaseMinterAllowance below 0', async function () {
        // configureMinter and allowMinter for 1000 ether
        await ONEusdContract.configureMinter(addr1.address, parseEther('1000'));
        expect(await ONEusdContract.minterAllowance(addr1.address)).to.equal(parseEther('1000'));
        
        // Decrease minter allowance for addr1 1001 ether
        try{
            await ONEusdContract.decreaseMinterAllowance(addr1.address, parseEther('1001'));
        }catch(e){
            expect(e.message).to.contain('Minter allowance cannot be decreased below 0');
        }
    });

    it('Mint from not allowed, mint more than allowed', async function () {        
        // Mint from addr1
        try{
            await ONEusdContract.mint(addr1.address, parseEther('1000'));
        }catch(e){
            expect(e.message).to.contain('Minter not configured');
        }

        // allowMinter for 1000 ether
        await ONEusdContract.configureMinter(addr1.address, parseEther('1000'));
        expect(await ONEusdContract.minterAllowance(addr1.address)).to.equal(parseEther('1000'));

        // Mint more than allowed
        try{
            await ONEusdContract.connect(addr1).mint(addr1.address, parseEther('1001'));
        }catch(e){
            expect(e.message).to.contain('Mint amount exceeds minterAllowance');
        }

        expect(await ONEusdContract.balanceOf(addr1.address)).to.equal(parseEther('0'));
    });

    it('Burn function', async function () {
        // configureMinter and allowMinter for 1000 ether
        await ONEusdContract.configureMinter(addr1.address, parseEther('1000'));
        expect(await ONEusdContract.minterAllowance(addr1.address)).to.equal(parseEther('1000'));

        // Minting 500 ether to addr1
        await ONEusdContract.connect(addr1).mint(addr1.address, parseEther('500'));
        expect(await ONEusdContract.balanceOf(addr1.address)).to.equal(parseEther('500'));

        // Minting 400 ether to addr2
        await ONEusdContract.connect(addr1).mint(addr2.address, parseEther('400'));
        expect(await ONEusdContract.balanceOf(addr2.address)).to.equal(parseEther('400'));

        // Burn 100 ether from addr1
        await expect(await ONEusdContract.connect(addr1).burn(parseEther('100'))).to.emit(ONEusdContract, 'Transfer').withArgs(addr1.address, ZERO_ADDRESS, parseEther('100'));
        expect(await ONEusdContract.balanceOf(addr1.address)).to.equal(parseEther('400'));

        // Burn from non minter
        try{
            await ONEusdContract.connect(addr2).burn(parseEther('100'));
        }catch(e){
            expect(e.message).to.contain('Minter not configured');
        }
        expect(await ONEusdContract.balanceOf(addr2.address)).to.equal(parseEther('400'));

        // Burn more than balance
        try{
            await ONEusdContract.connect(addr1).burn(parseEther('401'));
        }catch(e){
            expect(e.message).to.contain('ERC20: burn amount exceeds balance');
        }
        expect(await ONEusdContract.balanceOf(addr1.address)).to.equal(parseEther('400'));
    });

    it('BurnFrom function', async function () {
        // configureMinter and allowMinter for 1000 ether
        await ONEusdContract.configureMinter(addr1.address, parseEther('1000'));
        expect(await ONEusdContract.minterAllowance(addr1.address)).to.equal(parseEther('1000'));

        // Minting 500 ether to addr1
        await ONEusdContract.connect(addr1).mint(addr1.address, parseEther('500'));
        expect(await ONEusdContract.balanceOf(addr1.address)).to.equal(parseEther('500'));

        // Minting 400 ether to addr2
        await ONEusdContract.connect(addr1).mint(addr2.address, parseEther('400'));
        expect(await ONEusdContract.balanceOf(addr2.address)).to.equal(parseEther('400'));

        // Approve 100 ether from addr1 to addr2
        await ONEusdContract.connect(addr1).approve(addr2.address, parseEther('100'));
        expect(await ONEusdContract.allowance(addr1.address, addr2.address)).to.equal(parseEther('100'));

        // Burn 100 ether from addr1
        await expect(await ONEusdContract.connect(addr2).burnFrom(addr1.address, parseEther('100'))).to.emit(ONEusdContract, 'Transfer').withArgs(addr1.address, ZERO_ADDRESS, parseEther('100'));
        expect(await ONEusdContract.balanceOf(addr1.address)).to.equal(parseEther('400'));
        expect(await ONEusdContract.allowance(addr1.address, addr2.address)).to.equal(parseEther('0'));

        // try to burn again more than approved
        try{
            await ONEusdContract.connect(addr2).burnFrom(addr1.address, parseEther('101'));
        }catch(e){
            expect(e.message).to.contain('ERC20: insufficient allowance');
        }
    });

    it('Blacklist mint/trasfer', async function () {
        // configureMinter and allowMinter for 1000 ether
        await ONEusdContract.configureMinter(addr1.address, parseEther('1000'));
        expect(await ONEusdContract.minterAllowance(addr1.address)).to.equal(parseEther('1000'));

        // Minting 500 ether to addr1
        await ONEusdContract.connect(addr1).mint(addr1.address, parseEther('500'));
        expect(await ONEusdContract.balanceOf(addr1.address)).to.equal(parseEther('500'));

        // Minting 400 ether to addr2
        await ONEusdContract.connect(addr1).mint(addr2.address, parseEther('400'));
        expect(await ONEusdContract.balanceOf(addr2.address)).to.equal(parseEther('400'));

        // Blacklist addr1
        await ONEusdContract.setBlacklist(addr1.address, true);
        expect(await ONEusdContract.hasRole(ONEusdContract.BLACKLISTED_ROLE(), addr1.address)).to.equal(true);

        // Mint from addr1
        try{
            await ONEusdContract.connect(addr1).mint(addr1.address, parseEther('100'));
        }catch(e){
            expect(e.message).to.contain('Blacklisted');
        }

        // Transfer from addr1 to addr2
        try{
            await ONEusdContract.connect(addr1).transfer(addr2.address, parseEther('100'));
        }catch(e){
            expect(e.message).to.contain('Blacklisted');
        }

        // Transfer from addr2 to addr1
        try{
            await ONEusdContract.connect(addr2).transfer(addr1.address, parseEther('100'));
        }catch(e){
            expect(e.message).to.contain('Blacklisted');
        }

        // Burn from add1
        try{
            await ONEusdContract.connect(addr1).burn(parseEther('100'));
        }catch(e){
            expect(e.message).to.contain('Blacklisted');
        }

        // Remove blacklist from addr1
        await ONEusdContract.setBlacklist(addr1.address, false);

        // Mint from addr1
        await ONEusdContract.connect(addr1).mint(addr1.address, parseEther('100'));
        // Transfer from addr1 to addr2
        await ONEusdContract.connect(addr1).transfer(addr2.address, parseEther('100'));
        // Transfer from addr2 to addr1
        await ONEusdContract.connect(addr2).transfer(addr1.address, parseEther('100'));
        // Burn from add1
        await ONEusdContract.connect(addr1).burn(parseEther('100'));
    });
});