import express from 'express';
import {MongoClient} from 'mongodb';
import path from   'path'

const app = express();

// telling server where to look for static files
app.use(express.static(path.join(__dirname,'/build')))
app.use(express.json());
app.use(express.urlencoded({extended:true}));

//fake db for upvotes count
//adding one more prpty comments
//commenting bcz db created in mongodb with this info
// const articleInfo = {
//     "learn-react" : {upvotes : 0, comments:[]},
//     "learn-node" : {upvotes : 0, comments : []},
//     "my-thoughts-on-resumes" : {upvotes : 0, comments:[]}
// }

//callback fn that is called when req comes in /hello
app.get('/hello', (req,res)=> res.send('Hello!!!'));
app.post('/hello', (req,res) => {
    res.send(`Hello ${req.body.name}!`)});
//taking params from url
app.get('/hello/:name', (req,res)=>{
    res.send(`Hello ${req.params.name} !`)
})

//creating a common fn for DB connection setup
//we r passing diff operations like updatedb / delete db as arg 'operations'
const withDB = async (operations,res) => {
    try{
        //client obj is used to make req
        //mongoclient(url...this is url for local db, fn to avoid error)
        const client = await MongoClient.connect('mongodb://localhost:27017', {useNewUrlParser : true});
        const db = client.db('my-blog');
        
        //operations on db we need to perform
        await operations(db);

        //close connection with db
        client.close();
    }
    catch(error){
        res.status(500).json({message : "Error connecting to db",error});
    }
}

//rewriting get data api
app.get('/api/articles/:name', async (req,res) =>{
    //call db setup and pass the fn as arg
    //fn will do the activities in this get req
    //also pass res obj as arg bcz withDB fn is sending res in case of error
        withDB(async (db)=>{
            const articleName = req.params.name;
            const articleInfo = await db.collection('articles').findOne({name : articleName});
        
            res.status(200).json(articleInfo);
        }, res)
        
})

// //get api to get data from db
// app.get('/api/articles/:name', async (req,res) =>{
//     try{
//         const articleName = req.params.name;
    
//         //client obj is used to make req
//         //mongoclient(url...this is url for local db, fn to avoid error)
//         const client = await MongoClient.connect('mongodb://localhost:27017', {useNewUrlParser : true});
        
//         const db = client.db('my-blog');
//         const articleInfo = await db.collection('articles').findOne({name : articleName});
    
//         res.status(200).json(articleInfo);
//         //close connection with db
//         client.close();
//     }
//     catch(error){
//         res.status(500).json({message : "Error connecting to db",error});
//     }
// })




// //upvote route
// app.post('/api/articles/:name/upvote',(req,res)=> {
//     const articleName = req.params.name;
//     //[] bcz its variable name not real value inside obj
//     articleInfo[articleName].upvotes += 1;
//     res.status(200).send(`${articleName} now has ${articleInfo[articleName].upvotes} upvotes!`)
// })

//rewriting using withDB fn
app.post('/api/articles/:name/upvote', async (req,res) => {
    withDB(async (db) =>{
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({name : articleName});
        await db.collection('articles').updateOne({name : articleName}, {$set: {upvotes : articleInfo.upvotes+1}});
        const updatedArticleInfo = await db.collection('articles').findOne({name : articleName});
    
        res.status(200).json(updatedArticleInfo);
    },res)
})

// //upvote using db
// app.post('/api/articles/:name/upvote', async (req,res) => {
//     try{
//         const articleName = req.params.name;

//         const client = await MongoClient.connect('mongodb://localhost:27017', {useNewUrlParser : true});
//         const db = client.db('my-blog');
    
//         const articleInfo = await db.collection('articles').findOne({name : articleName});
//         await db.collection('articles').updateOne({name : articleName}, {$set: {upvotes : articleInfo.upvotes+1}});
//         const updatedArticleInfo = await db.collection('articles').findOne({name : articleName});
    
//         res.status(200).json(updatedArticleInfo);
    
//         client.close();
//     }
//     catch(error){
//         res.status(500).json({message:"Error connecting to DB", error});
//     }    
// })

//adding comment using withDB fn
app.post('/api/articles/:name/comments', (req,res) =>{

    withDB(async (db)=>{
        const articleName = req.params.name;
        const { username, text} = req.body;

        const articleInfo = await db.collection('articles').findOne({name : articleName});
        await db.collection('articles').updateOne({name:articleName}, {$set : {comments : articleInfo.comments.concat({username, text})}});
        const updatedArticleInfo = await db.collection('articles').findOne({name : articleName});

        res.status(200).json(updatedArticleInfo);
    }, res)
    

    
})

// //adding comment also in articleInfo object
// app.post('/api/articles/:name/comments', (req,res) =>{
//     const articleName = req.params.name;
//     const { username, text} = req.body;

//     articleInfo[articleName].comments.push({username, text});
//     res.status(200).send(articleInfo[articleName]);
// })

//allow client side app to navigate to pages and url
//tells that all api s be directd to app
app.get('*', (req,res)=>{
    res.sendFile(path.join(__dirname+ '/build/index.html'));
})

//port defined as 8000,callback fn that gets called when server is listening on 8000
app.listen(8000, ()=> console.log('Server running on port 8000'));