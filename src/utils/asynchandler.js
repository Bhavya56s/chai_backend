const ansyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    }
}




export { ansyncHandler}




// const ansyncHandler = (fn) => async (req, res, next) => {}

// try {
//   await   fn(req, res, next)
// } catch (error) {
//     res.status(err.code || 500).json({
//         success: false,
//         message: err.message
//     })
// }
