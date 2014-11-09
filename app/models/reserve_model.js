var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var Objectid = mongoose.Schema.Types.ObjectId;

var ReserveSchema   = new Schema({
	user_id: { type: Objectid, index: true },
	description: String,
	source_type: String,
	source_id: Objectid,
	date: { type: Date, default: Date.now },
	amount: { type: Number, validate: function(v) { return (v < 0) } },
	cred_type: { type: String, validate: /space|stuff/, index: true },
	_owner_id: Objectid
});

ReserveSchema.set("_perms", {
	admin: "crud",
	owner: "cr",
	user: "c"
});

ReserveSchema.post("save", function(transaction) { //Keep our running total up to date
	try {
		var User = require("./user_model");
		User.findOne({ _id: transaction.user_id }, function(err, user) {
			if (err) {
				console.log("Err", err);
				return;
			}
			if (!user) {
				console.log("Could not find user", transaction.user_id);
			} else {
				(user[transaction.cred_type + "_total"]) ? user[transaction.cred_type + "_total"] = user[transaction.cred_type + "_total"] + transaction.amount : user[transaction.cred_type + "_total"] = transaction.amount;
				(user[transaction.cred_type + "_reserve"]) ? user[transaction.cred_type + "_reserve"] = user[transaction.cred_type + "_reserve"] + transaction.amount : user[transaction.cred_type + "_reserve"] = transaction.amount;
				user.save();
			}
		});
	} catch(err) {
		console.log("Error", err);
		// throw(err);
	}
});

ReserveSchema.post("remove", function(transaction) { //Keep our running total up to date
	console.log("Going to remove reserve");
	try {
		var User = require("./user_model");
		User.findOne({ _id: transaction.user_id }, function(err, user) {
			if (err) {
				console.log("Err", err);
				return;
			}
			if (!user) {
				console.log("Could not find user", transaction.user_id);
			} else {
				(user[transaction.cred_type + "_total"]) ? user[transaction.cred_type + "_total"] = user[transaction.cred_type + "_total"] - transaction.amount : user[transaction.cred_type + "_total"] = ( transaction.amount * -1 );
				(user[transaction.cred_type + "_reserve"]) ? user[transaction.cred_type + "_reserve"] = user[transaction.cred_type + "_reserve"] - transaction.amount : user[transaction.cred_type + "_reserve"] = ( transaction.amount  * -1);
				user.save();
			}
		});
	} catch(err) {
		console.log("Error", err);
		// throw(err);
	}
});

module.exports = mongoose.model('Reserve', ReserveSchema);