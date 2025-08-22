import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
{
    name:{type:String,required:true, trim:true},
    email:{type:String,required:true,unique:true,lowercase:true},
    password:{type:String,enum:["patient","doctor","admin"],default:"patient"},
    doctor:{type:mongoose.Schema.Types.ObjectId,ref:"Doctor", default:null}// if this is a doctor,
},
{timestamps:true}
);

userSchema.pre("save",async function (next){
    if(!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt);
    next();
});

userSchema.methods.matchPassword =async function (plain){ return bcrypt.compare(plain,this.password );

};

export default mongoose.model("User",userSchema);