class apiError extends Error{
    constructor(
        statusCode,
        messgae = " Something went wrong",
        errors = [],
        stack = ""

    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = messgae
        this.success = false
        this.errors = errors

        if (stack) {
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
    

}

export {apiError}