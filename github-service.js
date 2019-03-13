const Environment = require('./environment')

// Assign our ENV
process.env = Object.assign(Environment, process.env)

const port = process.env.PORT || 6121

// Start the actual server.
require('./config/server')
  .createServer()
  .listen(port, () => {
    console.log('Server started on port ' + port)
    console.log('Press Ctrl-C to terminate...')
  })
