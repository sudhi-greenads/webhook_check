function loggerMiddleware(req, res, next) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} | AuthHeader: ${req.headers.authorization ? 'Present' : 'Missing'}`);
    
    // Log the response status code when it finishes
    res.on('finish', () => {
        console.log(`[${timestamp}] ${req.method} ${req.originalUrl} -> Status: ${res.statusCode}`);
    });
    
    next();
}

module.exports = loggerMiddleware;
