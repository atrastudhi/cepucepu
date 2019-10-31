const Twit = require('twit');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors());

dotenv.config();

let T = new Twit({
    consumer_key:         process.env.CONSUMER_KEY,
    consumer_secret:      process.env.CONSUMER_SECRET,
    access_token:         process.env.ACCESS_TOKEN,
    access_token_secret:  process.env.ACCESS_SECRET
});

let fetchTweet = (user, max_id) => {
    return new Promise((resolve, reject) => {
        T.get('statuses/user_timeline', { screen_name: user, count: 200, max_id: max_id }, function(err, data, response) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            };
        });
    });
};

let filter = (list) => {
    let temp = [];
    let rank = [];

    for (let i = 0; i < list.length; i++) {
        if (temp.includes(list[i])) {
            for (let x = 0; x < rank.length; x++) {
                if (rank[x].username == list[i]) {
                    rank[x].count++;
                }
            }
        }

        else {
            rank.push({
                username: list[i],
                count: 1
            });
            temp.push(list[i]);
        }
    }

    return rank;
}

app.get('/:username', async (req, res) => {
    try {
        console.log(`hit ${req.params.username}`)
        let memberMentions = [];

        let counter = 1;
        let max_id;

        while (counter < 6) {
            let tweets = await fetchTweet(req.params.username, max_id);
            
            if (tweets.length > 1) {
                for (let i = 1; i < tweets.length; i++) {

                    for (let j = 0; j < tweets[i].entities.user_mentions.length; j++) {
                        if (tweets[i].entities.user_mentions[j].screen_name.includes('JKT48')) {
                            memberMentions.push(tweets[i].entities.user_mentions[j].screen_name);
                        }
                    }
    
                }

                max_id = tweets[tweets.length - 1].id_str;
                
                counter ++;
            } else {
                counter = 6;
            }

            console.log(tweets.length)
        }
        
        let rank = filter(memberMentions);

        rank.sort((a, b) => b.count - a.count);
        
        res.status(200).json(rank.slice(0, 3));
    } catch (err) {
        res.status(500).json(err);
    }
})

app.listen(8080);
