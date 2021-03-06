// Load dependencies
const { expect } = require('chai');
const { Wallet, BigNumber, utils } = require('ethers');
const { signMetaTxRequest } = require("../src/signer");
 
// Start test block
describe('ONEamericas (proxy)', function () {
    
    let tokenContractFactory;
    let token;
    let forwarderContractFactory;
    let forwarder;
    let owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        forwarderContractFactory = await ethers.getContractFactory('MinimalForwarder');
        forwarder = await forwarderContractFactory.deploy();
        tokenContractFactory = await ethers.getContractFactory("ONEamericas");
        token = await upgrades.deployProxy(tokenContractFactory, {constructorArgs: [forwarder.address], unsafeAllow: ["constructor"]}, {initializer: 'initialize'});

        expect(await token.balanceOf(owner.address)).to.equal(utils.parseEther("100000000000"));
        expect(await token.balanceOf(addr1.address)).to.equal(0);
        expect(await token.balanceOf(addr2.address)).to.equal(0);
    });
    
    // Test case
    it('Token Attributes (name, symbol, decimals)', async function () {
        //Verifying the name of the token
        expect(await token.name()).to.equal('ONEamericas') ;
        //Verifying the symbol of the token
        expect(await token.symbol()).to.equal('ONEAM') ;
        //Verifying the decimals of the token.
        expect(await token.decimals()).to.equal(18) ;
    });

    it('Transfer from owner to addr1', async function () {
        await token.transfer(addr1.address, utils.parseEther("10"));
        expect(await token.balanceOf(addr1.address)).to.equal(utils.parseEther("10"));
        expect(await token.balanceOf(owner.address)).to.equal(utils.parseEther("99999999990"));
    });

    it('Transfer from addr1 to addr2 and take taxes', async function () {
        await token.transfer(addr1.address, utils.parseEther("10"));
        await token.connect(addr1).transfer(addr2.address, utils.parseEther("10"));
        expect(await token.balanceOf(addr2.address)).to.equal(utils.parseEther("9.9"));
        expect(await token.balanceOf("0x000000000000000000000000000000000000dEaD")).to.equal(utils.parseEther("0.05"));
        expect(await token.balanceOf("0x2222222222222222222222222222222222222222")).to.equal(utils.parseEther("0.05"));
        expect(await token.balanceOf(addr1.address)).to.equal(0);
    });

    it('bulkTransfer from addr1 multiple and take taxes', async function () {
        await token.transfer(addr1.address, utils.parseEther("100"));
        await token.connect(addr1).bulkTransfer(["0x3333333333333333333333333333333333333333","0x4444444444444444444444444444444444444444"], [utils.parseEther("10"), utils.parseEther("10")]);
        expect(await token.balanceOf("0x3333333333333333333333333333333333333333")).to.equal(utils.parseEther("9.9"));
        expect(await token.balanceOf("0x4444444444444444444444444444444444444444")).to.equal(utils.parseEther("9.9"));
        expect(await token.balanceOf("0x000000000000000000000000000000000000dEaD")).to.equal(utils.parseEther("0.1"));
        expect(await token.balanceOf("0x2222222222222222222222222222222222222222")).to.equal(utils.parseEther("0.1"));
        expect(await token.balanceOf(addr1.address)).to.equal(utils.parseEther("80"));

        await token.connect(addr1).burn(utils.parseEther("10"));
        expect(await token.balanceOf(addr1.address)).to.equal(utils.parseEther("70"));
        // expect(() => token.connect(addr1).burnFrom(owner.address, utils.parseEther("100"))).to.throw('ERC20: insufficient allowance');
    });

    it("metaTransfer via a meta-tx", async function() {
        await token.transfer(addr1.address, utils.parseEther("10"));
        expect(await token.balanceOf(addr1.address)).to.equal(utils.parseEther("10"));
        const signer = addr1;
        const relayer = addr2;
        const forwarderR = forwarder.connect(relayer);
    
        const { request, signature } = await signMetaTxRequest(signer.provider, forwarderR, {
          from: signer.address,
          to: token.address,
          data: token.interface.encodeFunctionData('metaTransfer', [addr2.address, utils.parseEther("9"), utils.parseEther("1")]),
        });
        
        await forwarderR.execute(request, signature).then(tx => tx.wait());
    
        expect(await token.balanceOf(addr1.address)).to.equal(utils.parseEther("0"));
        expect(await token.balanceOf("0x1111111111111111111111111111111111111111")).to.equal(utils.parseEther("1"));
        expect(await token.balanceOf(addr2.address)).to.equal(utils.parseEther("8.91"));
        expect(await token.balanceOf("0x000000000000000000000000000000000000dEaD")).to.equal(utils.parseEther("0.045"));
        expect(await token.balanceOf("0x2222222222222222222222222222222222222222")).to.equal(utils.parseEther("0.045"));

    });

    it("upgrade contract and mint", async function() {
        await token.transfer(addr1.address, utils.parseEther("10"));
        let tokenV2ContractFactory = await ethers.getContractFactory("ONEamericasV2");
        let tokenV2 = await upgrades.upgradeProxy(token.address, tokenV2ContractFactory, {constructorArgs: [forwarder.address], unsafeAllow: ["constructor"]});

        expect(await tokenV2.balanceOf(addr1.address)).to.equal(utils.parseEther("10"));

        await tokenV2.mint(addr1.address, utils.parseEther("10"));

        expect(await tokenV2.balanceOf(addr1.address)).to.equal(utils.parseEther("20"));
    });

    it("upgrade contract and metaTransfer", async function() {
        await token.transfer(addr1.address, utils.parseEther("10"));
        let tokenV2ContractFactory = await ethers.getContractFactory("ONEamericasV2");
        let tokenV2 = await upgrades.upgradeProxy(token.address, tokenV2ContractFactory, {constructorArgs: [forwarder.address], unsafeAllow: ["constructor"]});

        expect(await tokenV2.balanceOf(addr1.address)).to.equal(utils.parseEther("10"));

        const signer = addr1;
        const relayer = addr2;
        const forwarderR = forwarder.connect(relayer);

        //console.log("contracts", token.address, tokenV2.address);
    
        const { request, signature } = await signMetaTxRequest(signer.provider, forwarderR, {
          from: signer.address,
          to: tokenV2.address,
          data: tokenV2.interface.encodeFunctionData('metaTransfer', [addr2.address, utils.parseEther("9"), utils.parseEther("1")]),
        });
        
        await forwarderR.execute(request, signature).then(tx => tx.wait());
    
        expect(await tokenV2.balanceOf(addr1.address)).to.equal(utils.parseEther("0"));
        expect(await tokenV2.balanceOf("0x1111111111111111111111111111111111111111")).to.equal(utils.parseEther("1"));
        expect(await tokenV2.balanceOf(addr2.address)).to.equal(utils.parseEther("8.91"));
        expect(await tokenV2.balanceOf("0x000000000000000000000000000000000000dEaD")).to.equal(utils.parseEther("0.045"));
        expect(await tokenV2.balanceOf("0x2222222222222222222222222222222222222222")).to.equal(utils.parseEther("0.045"));
    });
});