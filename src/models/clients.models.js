const sql = require("../libraries/sql");
const db = require("../config/database");

const insertClientInfo = async(data,connection)=>{
    try {
        const result = await sql.insert_transaction("clients",data,connection);
        return result;
    } catch (error) {
        console.log(error);
        if(error.message.includes("conflict")){
            throw new Error(`conflict : user_name '${data.user_name}'`)
            }else{
            throw new Error(error.message);
           }
    }
}

const getClientByCondition = async(condition,columns=[""])=>{
    try {
        const result = await sql.select("clients",columns,condition);
        return result;
    } catch (error) {
        console.log(error);
        throw new Error(error.message)
    }
}

const getClientWithPagination = async(pagination)=>{
    try {
        const {limit=10,page=1,query} = pagination;
        const options = {
            columns : ['c.client_name','c.user_name','c.industry','u.email','u.mobile_number','c.creation_time'],
            joins : [
                {
                    table : "users u",
                    on : "c.user_name = u.user_name"
                }
            ],
            pagination : {
                limit : limit,
                page : page,
                filter : query && query.trim() != "" ? {"c.client_name" : query,"u.user_name" : query} : {}
            },
            order_by : "c.creation_time DESC"
        }
        const result = await sql.join_tables_with_pagination("clients c",options);
        return result;
    } catch (error) {
        console.log(error);
        throw new Error(error.message)
    }
}

const deleteClient = async (username) => {
    return new Promise((resolve, reject) => {
        // First, check if there are customers associated with the client
        const checkQuery = `
            SELECT COUNT(*) as count 
            FROM customers 
            WHERE client_username = ?`;

        db.query(checkQuery, [username], (error, checkResult) => {
            if (error) {
                return reject(error);
            }

            const customerCount = checkResult[0].count;

            if (customerCount > 0) {
                // If there are associated customers, delete them, the client, and the user
                const deleteQuery = `
                    DELETE c, cl, u
                    FROM customers c
                    JOIN clients cl ON c.client_username = cl.user_name
                    JOIN users u ON cl.user_name = u.user_name
                    WHERE cl.user_name = ?`;

                db.query(deleteQuery, [username], (deleteError, deleteResult) => {
                    if (deleteError) {
                        return reject(deleteError);
                    }
                    resolve(deleteResult.affectedRows); // Number of rows deleted
                });
            } else {
                // If no associated customers, delete only the client and user
                const deleteClientQuery = `
                    DELETE cl, u
                    FROM clients cl
                    JOIN users u ON cl.user_name = u.user_name
                    WHERE cl.user_name = ?`;

                db.query(deleteClientQuery, [username], (deleteClientError, deleteClientResult) => {
                    if (deleteClientError) {
                        return reject(deleteClientError);
                    }
                    resolve(deleteClientResult.affectedRows); // Number of rows deleted
                });
            }
        });
    });
};

const getClientWithUser = async(condition)=>{
    try {
        const options = {
            columns : ['c.client_name' , 'c.user_name','c.industry','u.email','u.mobile_number'],
            joins : [
                {
                    table : "users u",
                    on : "c.user_name = u.user_name"
                }
            ],

            condition : condition
        }

        const result = await sql.join_tables("clients c",options)
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}


const updateClientInfo = async(condition , data)=>{
    try {
        const result = await sql.update("clients",data,condition);
        return result;
    } catch (error) {
        console.log(error.message);
        throw new Error(error.message);

    }
}


module.exports = {
    insertClientInfo,
    getClientByCondition,
    getClientWithPagination,
    deleteClient,
    getClientWithUser,
    updateClientInfo
}