import 'clarifai';
 
export const handleApiCall = (req, res) => {
    const raw = JSON.stringify({
        "user_app_id": {
          "user_id": 'profoundlyparker',
          "app_id": 'test'
        },
        "inputs": [
          {
              "data": {
                  "image": {
                      "url": req.body.input
                  }
              }
          }
      ]
     });
    fetch(`https://api.clarifai.com/v2/users/clarifai/apps/main/models/face-detection/versions/45fb9a671625463fa646c3523a3087d5/outputs`,
      { 
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Key ' + process.env.API_CLARIFAI
        },
        body: raw
      })
      .then(response => response.json()).then(data => res.json(data))
      .catch(err => res.status(400).json('unable to work with API'))
    }
  
      
// Increases entry count with each photo submission
export const image = (req, res, db) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries') 
    .then(entries => {
        res.json(entries[0].entries);
    })
    .catch(err => res.status(400).json('unable to get entries'));
}
