const generateCode = ( length = 6, charSet = '1234567890' )=>{
    let randomString = '';
    for (let i = 0; i < length; i++) {
        let randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    
    return randomString;

}
module.exports={
    generateCode
}