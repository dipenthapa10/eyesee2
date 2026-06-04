const express = require('express')
const app = express()

app.get('/', (req, res) => {
    res.send('eyesee2 server is running')
})

app.listen(3001, () => {
    console.log('Server is running on port 3001')
}
)