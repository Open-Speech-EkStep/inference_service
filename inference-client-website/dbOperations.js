const pgp = require('pg-promise')();
// require('dotenv').config();

const envVars = process.env;
let cn = {
    user: envVars.DB_USER,
    password: envVars.DB_PASS,
    database: envVars.DB_NAME,
    host: envVars.DB_HOST,
    logging: false,
    dialect: 'postgres',
    ssl: false,
    dialectOptions: {
        ssl: false,
    },
    operatorsAliases: false,
};

const db = pgp(cn);


const where = pgp.as.format('WHERE $1 and $2 and $3', [5, '1=1', '1=1']); // pre-format WHERE condition
// await db.any('SELECT * FROM products $1:raw', where);

const addFeedbackQuery = 'Insert into inference_feedback("user_id", "language", "audio_path", "text", "rating","feedback","device","browser") values ($1, $2, $3, $4, $5, $6, $7, $8);';
const getFeedbackQuery = 'Select * from inference_feedback order by created_on desc limit $1 offset $2';
// const getFeedbackFilterQuery = "Select * from inference_feedback where ${1} and ${2} and ${3}  order by created_on desc limit $4 offset $5";
const getFeedbackFilterQuery = 'SELECT * FROM inference_feedback WHERE $1:raw order by created_on desc limit $2 offset $3';
const getFeedbackFilterCountQuery = 'Select count(*) as num_feedback from inference_feedback WHERE $1:raw';
// const getFeedbackFilterCountQuery = 'Select count(*) as num_feedback from inference_feedback $1:raw';
// const getFeedbackFilterByRating = 'Select * from inference_feedback where rating=$1 order by created_on desc limit $2 offset $3';
// const getFeedbackFilterByRatingCount = 'Select count(*) as num_feedback from inference_feedback where rating=$1 limit $2 offset $3';
// const getFeedbackFilterByDevice = 'Select * from inference_feedback where device ILIKE $1 order by created_on desc limit $2 offset $3';
// const getFeedbackFilterByDeviceCount = 'Select count(*) as num_feedback from inference_feedback where device ILIKE $1 limit $2 offset $3';
// const getFeedbackFilterByBrowser = 'Select * from inference_feedback where browser ILIKE $1 order by created_on desc limit $2 offset $3';
// const getFeedbackFilterByBrowserCount = 'Select count(*) as num_feedback from inference_feedback where browser ILIKE $1 limit $2 offset $3';
// const getFeedbackFilterByRatingAndBrowser = 'Select * from inference_feedback where rating=$1 and browser ILIKE $2 order by created_on desc limit $3 offset $4';
// const getFeedbackFilterByRatingAndDevice = 'Select * from inference_feedback where rating=$1 and device ILIKE $2 order by created_on desc limit $3 offset $4';
// const getFeedbackFilterByDeviceAndBrowser = 'Select * from inference_feedback where device ILIKE $1 and browser ILIKE $2 order by created_on desc limit $3 offset $4';
// const getFeedbackFilterByRatingAndDeviceAndBrowser = 'Select * from inference_feedback where rating=$1 and device ILIKE $2 and browser ILIKE $3 order by created_on desc limit $4 offset $5';
// const getFeedbackFilterByRatingAndDeviceCount = 'Select count(*) as num_feedback from inference_feedback where rating=$1 and device ILIKE $2 limit $3 offset $4';
// const getFeedbackFilterByRatingAndBrowserCount = 'Select count(*) as num_feedback from inference_feedback where rating=$1 and browser ILIKE $2 limit $3 offset $4';
// const getFeedbackFilterByDeviceAndBrowserCount = 'Select count(*) as num_feedback from inference_feedback where device ILIKE $1 and browser ILIKE $2 limit $3 offset $4';
// const getFeedbackFilterByRatingAndDeviceAndBrowserCount = 'Select count(*) as num_feedback from inference_feedback where rating=$1 and device ILIKE $2 and broswer ILIKE $3 limit $4 offset $5';
const getFeedbackCountQuery = 'Select count(*) as num_feedback from inference_feedback';

const getCount = (query, params) => {
    return db.one(query, params)
}

const getErrorPromise = (error) => {
    return new Promise((resolve, reject) => {
        reject(error)
    })
}

const getSuccessPromise = (data) => {
    return new Promise((resolve, reject) => {
        resolve(data)
    })
}


const addFeedback = (user_id, language, audio_path, text, rating, feedback, device, browser) => {
    return db.none(addFeedbackQuery, [
        user_id,
        language,
        audio_path,
        text,
        rating,
        feedback,
        device,
        browser
    ])
}

const getFeedback = async (offset, size = 10, ratingFilter, deviceFilter, browserFilter, dateFilter) => {
    const totalCountJSON = await getCount(getFeedbackCountQuery, []);
    let totalCount = totalCountJSON['num_feedback'];
    let filteredCount = totalCount;
    // let query = getFeedbackQuery;
    // let params = [size, offset];
    const ratingCondition = ratingFilter && ratingFilter !== '';
    const deviceCondition = deviceFilter && deviceFilter !== '';
    const browserCondition = browserFilter && browserFilter !== '';
    const dateCondition = dateFilter && dateFilter !== '';

    if (!ratingCondition)
        ratingFilter = 'true'
    else
        ratingFilter = "rating=" + "\'" + ratingFilter + "\'"

    if (!deviceCondition)
        deviceFilter = 'true'
    else
        deviceFilter = 'device ILIKE ' + "\'" + deviceFilter + '%' + "\'"

    if (!browserCondition)
        browserFilter = 'true'
    else
        browserFilter = 'browser ILIKE ' + "\'" + browserFilter + '%' + "\'"

    if (!dateCondition)
        dateFilter = 'true'
    else
        dateFilter = "created_on::DATE=" + "\'" + dateFilter + "\'"
    let query = getFeedbackFilterQuery;
    let filter = pgp.as.format('$1:raw AND $2:raw AND $3:raw AND $4:raw', [ratingFilter, deviceFilter, browserFilter, dateFilter])
    let params = [filter, size, offset];
    let CountJSON = await getCount(getFeedbackFilterCountQuery, params);
    filteredCount = CountJSON['num_feedback'];


    // if (ratingCondition && deviceCondition && browserCondition) {
    //     query = getFeedbackFilterByRatingAndDeviceAndBrowser;
    //     params = [ratingFilter, deviceFilter+ "%", browserFilter+ "%", size, offset];
    //     let rdbCountJSON = await getCount(getFeedbackFilterByRatingAndDeviceAndBrowserCount, params);
    //     filteredCount = rdbCountJSON['num_feedback'];
    // } else if (ratingCondition && deviceCondition) {
    //     query = getFeedbackFilterByRatingAndDevice;
    //     params = [ratingFilter, deviceFilter+ "%", size, offset];
    //     let rdCountJSON = await getCount(getFeedbackFilterByRatingAndDeviceCount, params);
    //     filteredCount = rdCountJSON['num_feedback'];
    // } else if (ratingCondition && browserCondition) {
    //     query = getFeedbackFilterByRatingAndBrowser;
    //     params = [ratingFilter, browserFilter+ "%", size, offset];
    //     let rbCountJSON = await getCount(getFeedbackFilterByRatingAndBrowserCount, params);
    //     filteredCount = rbCountJSON['num_feedback'];
    // } else if (deviceCondition && browserCondition) {
    //     query = getFeedbackFilterByDeviceAndBrowser;
    //     params = [deviceFilter+ "%", browserFilter+ "%", size, offset];
    //     let dbCountJSON = await getCount(getFeedbackFilterByDeviceAndBrowserCount, params);
    //     filteredCount = dbCountJSON['num_feedback'];
    // } else if (ratingCondition) {
    //     query = getFeedbackFilterByRating;
    //     params = [ratingFilter, size, offset];
    //     console.log(query, params)
    //     let rCountJSON = await getCount(getFeedbackFilterByRatingCount, params);
    //     console.log("RR", rCountJSON)
    //     filteredCount = rCountJSON['num_feedback'];
    // } else if (deviceCondition) {
    //     query = getFeedbackFilterByDevice;
    //     params = [deviceFilter + "%", size, offset];
    //     let dCountJSON = await getCount(getFeedbackFilterByDeviceCount, params);
    //     filteredCount = dCountJSON['num_feedback'];
    // } else if (browserCondition) {
    //     query = getFeedbackFilterByBrowser;
    //     params = [browserFilter + "%", size, offset];
    //     let bCountJSON = await getCount(getFeedbackFilterByBrowserCount, params);
    //     filteredCount = bCountJSON['num_feedback'];
    // }
    // else if (dateCondition) {
    //     query = getFeedbackFilterByBrowser;
    //     params = [browserFilter + "%", size, offset];
    //     let bCountJSON = await getCount(getFeedbackFilterByBrowserCount, params);
    //     filteredCount = bCountJSON['num_feedback'];
    // }
    return db.many(query, params).then(result => {
        console.log(totalCount, filteredCount);
        return getSuccessPromise({"total": totalCount, "data": result, "filtered": filteredCount})
    }).catch(error => getErrorPromise(error))
}

module.exports = {
    addFeedback,
    getFeedback
}
