import db from '../models/index.js';
import sequelize from '../config/sequelizeInstance.js';

const seedDatabase = async () => {
  try {
    // 1. Reset Database
    await sequelize.sync({ force: true });
    console.log('🔄 Database cleared and tables recreated.');

    // 2. Base Setup: Employer & Business Area
    const employer = await db.employer.create({
      firstName: 'Alice',
      lastName: 'Manager',
      email: 'alice@business.com',
      businessName: 'The Local Bistro',
      location: '123 Main St',
      phoneNum: '555-0100'
    });

    const area = await db.businessArea.create({
      Name: 'Dining Room',
      EmployerID: employer.employerid //
    });

    // 3. Organizational: Positions & Schedules
    const serverPosition = await db.position.create({
      positionName: 'Server',
      payrate: '15.00',
      AreaID: area.AreaId //
    });

    const schedule = await db.schedule.create({
      nameOfSchedule: 'Standard Weekly Schedule',
      templateType: 'Default',
      startDate: new Date('2026-01-26'),
      AreaID: area.AreaId //
    });

    // 4. Tasks: List & Items
    const taskList = await db.taskList.create({
      description: 'Opening Duties',
      task: 'General Setup'
    });

    const taskItem = await db.taskListItem.create({
      description: 'Check fridge temperatures',
      TaskListID: taskList.taskListId //
    });

    // 5. Personnel: Employees & Users
    const john = await db.employee.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phoneNum: '555-0101'
    });

    const jane = await db.employee.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phoneNum: '555-0102'
    });

    // Link Employee to User (Auth)
    await db.user.create({
      fName: 'John',
      lName: 'Doe',
      email: 'john@example.com',
      EmployeeID: john.EmployeeID //
    });

    // Assign Position
    await db.employeePosition.create({
      status: 'Active',
      EmployeeID: john.EmployeeID, //
      PositionID: serverPosition.PositionId //
    });

    // 6. Scheduling: Shifts
    const shift1 = await db.shift.create({
      day: 'Monday',
      startDate: new Date('2026-01-26'),
      startTime: new Date('2026-01-26T09:00:00'),
      endTime: new Date('2026-01-26T17:00:00'),
      EmployeeID: john.EmployeeID, //
      ScheduleID: schedule.scheduleId, //
      TaskListID: taskList.taskListId //
    });

    // 7. Operations: Clocking In/Out
    await db.clockInTime.create({
      dateTime: new Date('2026-01-26T08:58:00'),
      startTime: new Date('2026-01-26T09:00:00'),
      day: new Date('2026-01-26'),
      ShiftID: shift1.shiftId //
    });

    // 8. Communication: Notifications & Requests
    await db.notification.create({
      message: 'New schedule published!',
      dateTime: new Date(),
      EmployeeID: john.EmployeeID //
    });

    await db.timeOff.create({
      startDate: new Date('2026-02-10'),
      endDate: new Date('2026-02-12'),
      reasons: 'Family vacation',
      EmployeeID: john.EmployeeID //
    });

    // Shift Swap (Jane offering to take John's shift)
    await db.shiftSwapRequest.create({
      ShiftID: shift1.shiftId, //
      EmployeeOfferID: jane.EmployeeID, //
      EmployeeAcceptID: john.EmployeeID  //
    });

    // 9. Task Execution: Task Status
    await db.taskStatus.create({
      status: 'Completed',
      dateTime: new Date(),
      ShiftID: shift1.shiftId, //
      TaskListItemID: taskItem.taskListItemId //
    });

    console.log('✅ Comprehensive database seed complete!');
    process.exit();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();