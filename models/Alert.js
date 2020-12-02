const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  alertname: {
    type: String,
    required: true
  },
  alerttype: {
    type: String,
    required: true
  },
  dev_response: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  endpoint: {
    type: String
  }
});

const Alert = mongoose.model('Alert', AlertSchema);

module.exports = Alert;