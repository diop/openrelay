const IssueTokenFactory = artifacts.require("IssueTokenFactory");
const IssueToken = artifacts.require("IssueToken");
const redis = require("redis");
const ZeroEx = require("0x.js")

function issueToken(redisName, tokenFactory, redisClient) {
    var tokenAddress;
    tokenFactory.newToken.call().then((address) => {
        tokenAddress = address;
        redisClient.set(redisName + "::address", address.substr(2))
    })
    return tokenFactory.newToken().then(() => {
        return IssueToken.at(tokenAddress).issue(10**27);
    }).then(() => {
        return IssueToken.at(tokenAddress).transfer(web3.eth.accounts[1], 10**25);
    });
}

module.exports = function(done){
    var redisClient = redis.createClient(process.argv[4]);
    zeroEx = new ZeroEx.ZeroEx(web3.currentProvider);
    IssueTokenFactory.deployed().then((tokenFactory) => {
        return issueToken("feeToken", tokenFactory, redisClient).then(() => {
            return issueToken("tokenX", tokenFactory, redisClient);
        }).then(() => {
            return issueToken("tokenY", tokenFactory, redisClient);
        }).then(() => {
            return issueToken("tokenZ", tokenFactory, redisClient);
        }).then(() => {
            return zeroEx.proxy.getContractAddressAsync()
        }).then((contractAddress) => {
            return new Promise((resolve, reject) => {
                redisClient.set("tokenProxy::address", contractAddress, resolve)
            });
        }).then(done);
    })
}
