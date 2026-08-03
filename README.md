## This project is for the learning purpose, this has all the things which i have learned till so far

at first, stage we will define the BOE( Back of Envelope )

------------- DAILY ACTIVE USERS ARE 10 MILLION -------------
Suppose we have 1 Million request for per day to shorten the URL
and 10 Million request for the read of the URL, application will be read heavy
and the read:write ratio is 10:1

READ => Request per second  =  10 Million / 86400 = 120 Request per second for read ( at peak we will make it 3x which will be 360 ) 
WRITE => Request per second = 1 Million / 86400 =  15 Request per second for write

Storage : {
    on every write 
}



Functionalities
We need to short URL
Make a count of every URL clicked for the analytics

Non - Functionalities
The application is scalable, durable, and available.

SCHEMA
    URL_STORE : {
        id: unique,
        long_url: string,
        short_code: string,
        created_user_id: string,
        created_at: Date,
        updated_at: Date,
        expires_at: Date
        INDEX : {
            short_code
            created_user_id
        }
    }

    USER : {
        id: unique,
        user_name: string,
        full_name: string,
        email: string,
        password_hash: string,
        created_at: Date,
        updated_at: Date,
        INDEX : {
            email,
            user_name,
        }
    }

    // This will be the advance feature we will take care of that later

    ANALYTICS : {
        id : unique,
        url_id : string,
        click_count: number,
        created_at: Date,
        updated_at: Date
    }
