// Load dependencies
const { expect } = require('chai');
const { Wallet, BigNumber } = require('ethers');

// Start test block
describe('ONEamericas', function () {

    let tokenContractFactory;
    let token;
    let owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        tokenContractFactory = await ethers.getContractFactory("ONEamericas");
        token = await tokenContractFactory.deploy();
        await token.deployed();

        //Verifying the total supply & the balances of test accounts.
        //expect(await token.totalSupply()).to.equal(30);
        //expect(await token.balanceOf(owner.address)).to.equal(100 * 10 ** 18);
        expect(await token.balanceOf(addr1.address)).to.equal(0);
        expect(await token.balanceOf(addr2.address)).to.equal(0);
    });

  

    //console.log(wallet);
    
    // Test case
    it('Token Attributes', async function () {
        // Store a value
        //await ONEamericas.store(42);
    
        // Test if the returned value is the same one
        // Note that we need to use strings to compare the 256 bit integers
        //console.log(BigNumber);
        // console.log(await token.balanceOf(owner.address));
        // expect(await token.balanceOf(addr1.address)).to.equal(0);

        //Verifying the name of the token
        expect(await token.name()).to.equal('ONEamericas') ;
        //Verifying the symbol of the token
        expect(await token.symbol()).to.equal('ONEAM') ;
        //Verifying the decimals of the token.
        expect(await token.decimals()).to.equal(18) ;
    });
});