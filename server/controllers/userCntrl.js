import asyncHandler from 'express-async-handler';

import { prisma } from "../config/prismaConfig.js";

export const createUser = asyncHandler(async(req, res) => {
    console.log("creating a user");

    let {email} = req.body;
    const userExists = await prisma.user.findUnique({where: {email: email}});
    if (!userExists) {
        const user = await prisma.user.create({ data: req.body });
        res.send({
            message: "user registered successfully",
            user: user,
        });
    }   else res.status(201).send({ message: "user already registered" });
});

//function to book a visit to resd
export const bookvisit = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const { id } = req.params;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // 1️⃣ Check if residency exists
  const residency = await prisma.residency.findUnique({
    where: { id }
  });

  if (!residency) {
    return res.status(404).json({ message: "Residency not found" });
  }

  // 2️⃣ Get user bookings safely
  const user = await prisma.user.findUnique({
    where: { email },
    select: { bookedVisits: true }
  });

  const bookedVisits = user.bookedVisits || [];

  // 3️⃣ Prevent double booking
  const alreadyBooked = bookedVisits.some(
    (visit) => visit.id === id
  );

  if (alreadyBooked) {
    return res
      .status(400)
      .json({ message: "This residency is already booked by you" });
  }

  // 4️⃣ Book visit
  await prisma.user.update({
    where: { email },
    data: {
      bookedVisits: {
        push: {
          id,
          date: new Date()
        }
      }
    }
  });

  res.status(200).json({ message: "Your visit is booked successfully" });
});


// function to get all bookings of a user
export const getAllBookings = asyncHandler(async (req, res) => {
    const {email} = req.body
    try{
        const bookings = await prisma.user.findUnique({
            where: {email}, 
            select: {bookedVisits: true}
        })
        res.status(200).send(bookings)
    }catch(err){
        throw new Error(err.message);
    }
})

// function to cancel the booking
export const cancelBooking = asyncHandler(async (req, res) => {
    const {email}= req.body;
    const {id}=req.params
    try{

        const user = await prisma.user.findUnique({
            where: {email: email},
            select: {bookedVisits: true}
        })

        const index = user.bookedVisits.findIndex((visit)=> visit.id === id)

        if(index === -1){
            res.status(404).json({message: "Booking not found"})
        } else {
          user.bookedVisits.splice(index, 1)
          await prisma.user.update({
            where: {email},
            data: {
                bookedVisits: user.bookedVisits
            }
          })

          res.send("Booking cancelled successfully")
        }  
    }catch(err){
        throw new Error(err.message);
    }
})

// function to add a resd in favorite list of a user
export const toFav = asyncHandler( async( req, res)=> {
    const {email} = req.body;
    const {rid} = req.params;

    try{

        const user = await prisma.user.findUnique({
            where: {email}
        })

        if (user.favResidenciesID.includes(rid)) {
            const updateUser = await prisma.user.update({
                where: {email},
                data: {
                    favResidenciesID :{
                        set: user.favResidenciesID.filter((id)=> id !== rid)
                    }
                }
            });

            res.send({message: "Removed from favorites", user: updateUser})
        } else {
            const updateUser = await prisma.user.update({

                where: {email},
                data: {
                    favResidenciesID: {
                        push: rid
                    }
                }
            })

            res.send({message: "    Updated favorites", user: updateUser})
        }
    }catch(err)
    {
        throw new Error(err.message);
    }
})

//function to get all favorites
export const getAllFavorites = asyncHandler(async (req, res) => {
    const { email } = req.body;
    try {
        const favResd = await prisma.user.findUnique({
            where: { email }, 
            select: { favResidenciesID: true },
        });
        res.status(200).send(favResd);
    }   catch (err) {
        throw new Error(err.message);
    }
});