#!/usr/bin/env node

/**
 * Script to create the Mech Intern 50/30 Test
 * This script creates a comprehensive mechanical engineering test with 50 questions
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating Mech Intern 50/30 Test...\n');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Get or create admin user
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }

    console.log(`✅ Admin user found: ${adminUser.email}\n`);

    // Create the test
    const test = await prisma.test.create({
      data: {
        title: 'Mech Intern 50/30 Test',
        description:
          'A comprehensive mechanical engineering assessment with 50 questions covering various mechanical engineering concepts including strength of materials, design principles, automotive systems, robotics, and manufacturing processes.',
        lockOrder: false,
        allowReview: true,
        createdById: adminUser.id,
        includeAnalytics: true,
        emailNotificationsEnabled: true,
      },
    });

    console.log(`✅ Test created: ${test.title}`);
    console.log(`   Test ID: ${test.id}\n`);

    // Define all 50 mechanical engineering questions
    const questions = [
      {
        promptText: 'What is the primary type of stress induced in a driveshaft of a rear-wheel-drive car?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Torsional Stress', 'Bending Stress', 'Compressive Stress', 'Hoop Stress'],
        correctAnswerIndex: 0,
        sectionTag: 'Stress Analysis',
      },
      {
        promptText: 'The \'factor of safety\' is the ratio of:',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Working stress to ultimate stress', 'Breaking stress to ultimate stress', 'Ultimate stress to working stress', 'Ultimate stress to breaking stress'],
        correctAnswerIndex: 2,
        sectionTag: 'Design Safety',
      },
      {
        promptText: 'On a stress-strain curve, what does the area under the curve up to the fracture point represent?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Toughness per unit volume', 'Ultimate Tensile Strength', 'Modulus of Elasticity', 'Hardness'],
        correctAnswerIndex: 0,
        sectionTag: 'Material Properties',
      },
      {
        promptText: 'Why is an I-section beam preferred over a solid rectangular section for the same cross-sectional area?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['It is easier to manufacture.', 'It has a lower weight.', 'It experiences less shear stress.', 'It has a higher moment of inertia.'],
        correctAnswerIndex: 3,
        sectionTag: 'Beam Design',
      },
      {
        promptText: 'A point of contraflexure in a beam is where:',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Shear force is zero.', 'The deflection is maximum.', 'The slope is zero.', 'Bending moment is zero.'],
        correctAnswerIndex: 3,
        sectionTag: 'Beam Analysis',
      },
      {
        promptText: 'Between structural steel and aluminum, which has a higher Modulus of Elasticity?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Aluminum', 'Steel', 'They are both equal', 'It depends on the grade'],
        correctAnswerIndex: 1,
        sectionTag: 'Material Properties',
      },
      {
        promptText: 'What is the main purpose of a cotter joint?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['To connect rods in axial loading.', 'To join intersecting shafts.', 'To connect shafts in torsion.', 'To create a permanent joint.'],
        correctAnswerIndex: 0,
        sectionTag: 'Joint Design',
      },
      {
        promptText: 'Which failure theory is most suitable for ductile materials?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Max. Principal Stress Theory', 'Max. Shear Stress Theory', 'Mohr\'s Theory', 'Max. Strain Theory'],
        correctAnswerIndex: 1,
        sectionTag: 'Failure Theories',
      },
      {
        promptText: 'In a thin-walled cylindrical pressure vessel, what is the relationship between hoop stress (σh) and longitudinal stress (σl)?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['σh = σl', 'σh = 2 × σl', 'σh = 0.5 × σl', 'σh = 4 × σl'],
        correctAnswerIndex: 1,
        sectionTag: 'Pressure Vessels',
      },
      {
        promptText: 'What is the difference between hardness and toughness?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Hardness is resistance to bending.', 'Hardness is resistance to scratching.', 'Hardness is resistance to indentation.', 'Both B and C are correct.'],
        correctAnswerIndex: 3,
        sectionTag: 'Material Properties',
      },
      {
        promptText: 'What is the function of a differential in an automobile? ⚙️',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['To increase engine torque.', 'To allow front wheels to steer.', 'To allow drive wheels to rotate at different speeds.', 'To act as a gearbox.'],
        correctAnswerIndex: 2,
        sectionTag: 'Automotive Systems',
      },
      {
        promptText: 'Why are rolling contact bearings also called anti-friction bearings?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['They replace sliding with lower rolling friction.', 'They use special lubricants.', 'They are made of frictionless materials.', 'They work in a vacuum.'],
        correctAnswerIndex: 0,
        sectionTag: 'Bearings',
      },
      {
        promptText: 'What is the primary advantage of a dog clutch over a friction clutch?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['It provides a smoother engagement.', 'It can slip to prevent overload.', 'It is smaller for the same torque.', 'It provides positive engagement.'],
        correctAnswerIndex: 3,
        sectionTag: 'Clutches',
      },
      {
        promptText: 'If an input gear has 20 teeth and an output gear has 40 teeth, what is the gear ratio?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['0.5', '20', '40', '2'],
        correctAnswerIndex: 3,
        sectionTag: 'Gears',
      },
      {
        promptText: 'What is the function of an idler gear in a simple gear train?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['To increase the gear ratio.', 'To decrease the gear ratio.', 'To change the direction of rotation.', 'To increase the output torque.'],
        correctAnswerIndex: 2,
        sectionTag: 'Gear Trains',
      },
      {
        promptText: 'According to Grashof\'s law for a 4-bar mechanism, continuous relative motion is possible if:',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['S + L ≤ P + Q', 'L + P > S + Q', 'S + P > L + Q', 'L = S + P + Q'],
        correctAnswerIndex: 0,
        sectionTag: 'Mechanisms',
      },
      {
        promptText: 'What is the key difference between a mechanism and a machine?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['A mechanism has more links.', 'A machine transmits power/work.', 'A mechanism is always an open chain.', 'A machine has higher efficiency.'],
        correctAnswerIndex: 1,
        sectionTag: 'Machine Theory',
      },
      {
        promptText: 'Which of the following is a type of centrifugal governor?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Grashof governor', 'Ackermann governor', 'Geneva governor', 'Watt governor'],
        correctAnswerIndex: 3,
        sectionTag: 'Governors',
      },
      {
        promptText: 'What is the primary purpose of a flywheel in an engine?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['To store & release energy for smooth speed.', 'To reduce engine weight.', 'To increase engine power.', 'To balance the crankshaft.'],
        correctAnswerIndex: 0,
        sectionTag: 'Engine Components',
      },
      {
        promptText: 'In a belt drive system, what is \'creep\'?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Slipping of the belt from low tension.', 'Stretching of the belt over time.', 'Slight relative motion from elongation.', 'Wobbling of the pulley.'],
        correctAnswerIndex: 2,
        sectionTag: 'Belt Drives',
      },
      {
        promptText: 'The Ackermann steering principle is designed to ensure:',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Front wheels have positive camber.', 'Wheels trace concentric circles in a turn.', 'The vehicle has a low center of gravity.', 'Steering requires minimum effort.'],
        correctAnswerIndex: 1,
        sectionTag: 'Automotive Systems',
      },
      {
        promptText: 'What is the difference between camber and caster angles?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Camber is vertical tilt, Caster is steering axis tilt.', 'Camber is front tilt, Caster is top tilt.', 'Camber is for stability, Caster is for wear.', 'They are the same.'],
        correctAnswerIndex: 0,
        sectionTag: 'Vehicle Dynamics',
      },
      {
        promptText: 'What is the role of an anti-roll bar (sway bar)?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['To prevent rollover in an accident.', 'To improve ride comfort.', 'To connect steering to wheels.', 'To reduce body roll during cornering.'],
        correctAnswerIndex: 3,
        sectionTag: 'Suspension Systems',
      },
      {
        promptText: 'Which of these is considered \'unsprung mass\'?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['The engine', 'The chassis', 'The driver', 'The wheel and tire assembly'],
        correctAnswerIndex: 3,
        sectionTag: 'Vehicle Dynamics',
      },
      {
        promptText: 'What is the primary advantage of a Continuously Variable Transmission (CVT)?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['It is mechanically simpler.', 'It keeps the engine at its most efficient RPM.', 'It provides faster gear shifts.', 'It is lighter than other types.'],
        correctAnswerIndex: 1,
        sectionTag: 'Transmissions',
      },
      {
        promptText: 'In a braking system, \'brake fade\' refers to:',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['A reduction in braking from overheating.', 'A leak in the hydraulic lines.', 'The wearing out of brake pads.', 'Noise from worn-out brakes.'],
        correctAnswerIndex: 0,
        sectionTag: 'Braking Systems',
      },
      {
        promptText: 'A lower center of gravity in a race car primarily helps to:',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Increase aerodynamic downforce.', 'Improve stability and reduce weight transfer.', 'Reduce the overall weight of the car.', 'Increase the engine\'s power output.'],
        correctAnswerIndex: 1,
        sectionTag: 'Vehicle Dynamics',
      },
      {
        promptText: 'A MacPherson strut is a common type of:',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Suspension system', 'Engine mounting system', 'Steering system', 'Exhaust system'],
        correctAnswerIndex: 0,
        sectionTag: 'Suspension Systems',
      },
      {
        promptText: 'The purpose of a brake proportioning valve is to:',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Increase pressure to all wheels.', 'Warn the driver of low brake fluid.', 'Control brake pressure between front/rear wheels.', 'Engage the ABS.'],
        correctAnswerIndex: 2,
        sectionTag: 'Braking Systems',
      },
      {
        promptText: 'A higher \'power-to-weight ratio\' in a vehicle results in:',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Better acceleration.', 'Better fuel efficiency.', 'A more comfortable ride.', 'A higher top speed.'],
        correctAnswerIndex: 0,
        sectionTag: 'Vehicle Performance',
      },
      {
        promptText: 'What is the primary difference between a servo motor and a standard DC motor?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Servos can run at higher speeds.', 'Servos have feedback for position control.', 'DC motors require AC power.', 'Servos are only for linear motion.'],
        correctAnswerIndex: 1,
        sectionTag: 'Motors and Actuators',
      },
      {
        promptText: 'What does PWM (Pulse Width Modulation) directly control in a DC motor?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['The direction of rotation.', 'The motor\'s temperature.', 'The average voltage supplied (speed).', 'The motor\'s current limit.'],
        correctAnswerIndex: 2,
        sectionTag: 'Motor Control',
      },
      {
        promptText: 'An H-Bridge circuit is commonly used in robotics to:',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Step up the voltage for motors.', 'Control the speed and direction of a DC motor.', 'Convert AC to DC power.', 'Process sensor data.'],
        correctAnswerIndex: 1,
        sectionTag: 'Motor Drivers',
      },
      {
        promptText: 'Which is a common non-contact sensor for obstacle detection?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['A limit switch', 'An ultrasonic sensor', 'A potentiometer', 'A rotary encoder'],
        correctAnswerIndex: 1,
        sectionTag: 'Sensors',
      },
      {
        promptText: 'The \'degrees of freedom\' (DOF) of a robotic arm refers to:',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['The number of tasks it can perform.', 'Its maximum payload capacity.', 'The number of independent joints.', 'The speed of its end-effector.'],
        correctAnswerIndex: 2,
        sectionTag: 'Robotics',
      },
      {
        promptText: 'Which statement best describes a closed-loop control system?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['It uses sensor feedback to adjust its output.', 'It operates without any sensor input.', 'It is simpler than an open-loop system.', 'It can only be used for on/off control.'],
        correctAnswerIndex: 0,
        sectionTag: 'Control Systems',
      },
      {
        promptText: 'What is a key advantage of a pneumatic actuator in a Robowar bot?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['They provide precise position control.', 'They are silent during operation.', 'They offer a high power-to-weight ratio.', 'They are easy to control.'],
        correctAnswerIndex: 2,
        sectionTag: 'Pneumatics',
      },
      {
        promptText: 'Which mechanism is best for converting rotary motion into linear motion?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['A universal joint', 'A differential gear', 'A worm gear', 'A rack and pinion'],
        correctAnswerIndex: 3,
        sectionTag: 'Motion Conversion',
      },
      {
        promptText: 'In robotics, what is a \'gripper\' also known as?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['An actuator', 'A sensor', 'A controller', 'An end-effector'],
        correctAnswerIndex: 3,
        sectionTag: 'Robotics',
      },
      {
        promptText: 'Why are microcontrollers like Arduino commonly used in student robotics?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['They are the only processors available.', 'They have built-in motor drivers.', 'They are easy to program and interface.', 'They do not require a power supply.'],
        correctAnswerIndex: 2,
        sectionTag: 'Microcontrollers',
      },
      {
        promptText: 'What is the key difference between welding and brazing?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Welding melts base metals; brazing does not.', 'Brazing melts base metals.', 'Welding doesn\'t use filler material.', 'Brazing is only for steel.'],
        correctAnswerIndex: 0,
        sectionTag: 'Joining Processes',
      },
      {
        promptText: 'Which process creates a complex, one-off plastic part quickly?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Injection Molding', 'Forging', '3D Printing (FDM/SLA)', 'Casting'],
        correctAnswerIndex: 2,
        sectionTag: 'Manufacturing',
      },
      {
        promptText: 'On a lathe, what is the difference between a turning and a facing operation?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Turning reduces length; facing reduces diameter.', 'Turning creates a taper; facing creates a flat.', 'Turning reduces diameter; facing machines the end flat.', 'They are the same operation.'],
        correctAnswerIndex: 2,
        sectionTag: 'Machining',
      },
      {
        promptText: 'Why is heat treatment, like annealing, performed on a metal part?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['To make the metal harder.', 'To increase its brittleness.', 'To improve its surface finish.', 'To relieve internal stresses and increase ductility.'],
        correctAnswerIndex: 3,
        sectionTag: 'Heat Treatment',
      },
      {
        promptText: 'What does MIG stand for in MIG welding?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Metal Inert Gas', 'Manual Inert Gas', 'Metal Inverse Grind', 'Micro Inert Gas'],
        correctAnswerIndex: 0,
        sectionTag: 'Welding',
      },
      {
        promptText: 'Why are gussets added to welded frames?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['To increase the weight of the frame.', 'To reinforce the structure at joints/corners.', 'To provide a flat mounting surface.', 'To improve the aerodynamic profile.'],
        correctAnswerIndex: 1,
        sectionTag: 'Frame Design',
      },
      {
        promptText: 'What is the main functional difference between a bolt and a screw?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['A bolt is used with a nut; a screw threads into the part.', 'A bolt is always larger than a screw.', 'A screw is always fully threaded.', 'There is no difference.'],
        correctAnswerIndex: 0,
        sectionTag: 'Fasteners',
      },
      {
        promptText: 'What material is common for a BAJA ATV chassis and why?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Aluminum, for its light weight.', 'Carbon Steel (AISI 4130), for strength/weldability.', 'Stainless Steel, for corrosion resistance.', 'Titanium, for its strength.'],
        correctAnswerIndex: 1,
        sectionTag: 'Materials',
      },
      {
        promptText: 'What is the purpose of adding carbon to iron to make steel?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['To decrease its melting point.', 'To increase its hardness and strength.', 'To increase its ductility.', 'To improve corrosion resistance.'],
        correctAnswerIndex: 1,
        sectionTag: 'Metallurgy',
      },
      {
        promptText: 'The number \'6061\' in Aluminium 6061 primarily signifies:',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Its tensile strength.', 'Its density.', 'Its year of invention.', 'Its alloy composition.'],
        correctAnswerIndex: 3,
        sectionTag: 'Materials',
      },
    ];

    // Create all questions
    console.log('📝 Creating questions...\n');

    for (let i = 0; i < questions.length; i++) {
      const questionData = questions[i];

      const question = await prisma.question.create({
        data: {
          promptText: questionData.promptText,
          timerSeconds: questionData.timerSeconds,
          answerOptions: questionData.answerOptions,
          correctAnswerIndex: questionData.correctAnswerIndex,
          category: questionData.category,
          sectionTag: questionData.sectionTag,
          testId: test.id,
        },
      });

      console.log(
        `   ✅ Question ${i + 1} (${questionData.sectionTag}): ${questionData.promptText.substring(0, 50)}...`
      );
    }

    console.log(`\n🎉 Successfully created Mech Intern 50/30 Test!`);
    console.log(`   📊 Total questions: ${questions.length}`);
    console.log(`   🆔 Test ID: ${test.id}`);
    console.log(`   🕒 Total test time: ${(questions.length * 90) / 60} minutes`);
    console.log(
      `\n💡 You can now use this test by creating invitations or public links!`
    );

    // Show categories covered
    const sectionCounts = {};
    questions.forEach(q => {
      sectionCounts[q.sectionTag] = (sectionCounts[q.sectionTag] || 0) + 1;
    });

    console.log(`\n📋 Categories covered:`);
    Object.entries(sectionCounts).forEach(([section, count]) => {
      console.log(`   • ${section} (${count} question${count > 1 ? 's' : ''})`);
    });

  } catch (error) {
    console.error('❌ Error creating Mech Intern 50/30 test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = main;
