class apiError extends Error{
    constructor(
        statusCode,
        messgae = " Something went wrong",
        errors = [],
        statck = ""

    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = messgae
        this.success = false
        this.errors = errors

        if (statck) {
            this.stack = statck
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
    

}

export {apiError}