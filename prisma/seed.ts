import { PrismaClient, PermitStatus, PermitType, DocumentCategory, DocumentStatus, ChecklistItemStatus, InspectionStatus, FeeStatus, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── CLEAN UP (reverse dependency order) ────────────────────────────────────────
  await prisma.activity.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pushToken.deleteMany();
  await prisma.aiConversation.deleteMany();
  await prisma.permitTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.deadline.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.document.deleteMany();
  await prisma.checklistTemplate.deleteMany();
  await prisma.permit.deleteMany();
  await prisma.project.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.orgMembership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleaned up existing data.');

  // ─── USERS ───────────────────────────────────────────────────────────────────────

  const sarah = await prisma.user.create({
    data: {
      email: 'sarah.chen@westsidedev.com',
      name: 'Sarah Chen',
      phone: '310-555-0142',
    },
  });

  const marcus = await prisma.user.create({
    data: {
      email: 'marcus.johnson@westsidedev.com',
      name: 'Marcus Johnson',
      phone: '310-555-0187',
    },
  });

  const emily = await prisma.user.create({
    data: {
      email: 'emily.rodriguez@westsidedev.com',
      name: 'Emily Rodriguez',
      phone: '310-555-0231',
    },
  });

  console.log('Created 3 users.');

  // ─── ORGANIZATION ────────────────────────────────────────────────────────────────

  const org = await prisma.organization.create({
    data: {
      name: 'Westside Development Group',
      slug: 'westside-development-group',
      subscriptionTier: 'pro',
      settings: {
        timezone: 'America/Los_Angeles',
        defaultReminderDays: [7, 1],
        notifyOnStatusChange: true,
        weeklyDigestEnabled: true,
      },
    },
  });

  console.log('Created organization.');

  // ─── MEMBERSHIPS ─────────────────────────────────────────────────────────────────

  await prisma.orgMembership.createMany({
    data: [
      {
        userId: sarah.id,
        orgId: org.id,
        role: UserRole.OWNER,
        invitedAt: new Date('2024-01-15'),
        joinedAt: new Date('2024-01-15'),
      },
      {
        userId: marcus.id,
        orgId: org.id,
        role: UserRole.COORDINATOR,
        invitedAt: new Date('2024-01-16'),
        joinedAt: new Date('2024-01-17'),
      },
      {
        userId: emily.id,
        orgId: org.id,
        role: UserRole.COORDINATOR,
        invitedAt: new Date('2024-02-01'),
        joinedAt: new Date('2024-02-03'),
      },
    ],
  });

  // ─── SUBSCRIPTION ────────────────────────────────────────────────────────────────

  await prisma.subscription.create({
    data: {
      orgId: org.id,
      plan: 'pro',
      status: 'active',
      currentPeriodEnd: new Date('2025-01-15'),
      seats: 10,
    },
  });

  // ─── PROJECTS ────────────────────────────────────────────────────────────────────

  const project1 = await prisma.project.create({
    data: {
      orgId: org.id,
      name: 'Sunset Mixed-Use Development',
      description: 'Six-story mixed-use building with ground floor retail and 48 residential units',
      address: '1420 Sunset Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90026',
      latitude: 34.0769,
      longitude: -118.2614,
      startDate: new Date('2024-03-01'),
      estimatedEndDate: new Date('2025-09-30'),
      status: 'active',
    },
  });

  const project2 = await prisma.project.create({
    data: {
      orgId: org.id,
      name: 'Culver City Office Campus',
      description: 'Three-building office campus with parking structure and landscaping',
      address: '8800 Venice Blvd',
      city: 'Culver City',
      state: 'CA',
      zip: '90232',
      latitude: 34.0108,
      longitude: -118.3952,
      startDate: new Date('2024-06-01'),
      estimatedEndDate: new Date('2026-03-31'),
      status: 'active',
    },
  });

  const project3 = await prisma.project.create({
    data: {
      orgId: org.id,
      name: 'Marina del Rey Waterfront Renovation',
      description: 'Renovation and expansion of existing marina facility with new restaurant and retail',
      address: '4255 Admiralty Way',
      city: 'Marina del Rey',
      state: 'CA',
      zip: '90292',
      latitude: 33.9794,
      longitude: -118.4517,
      startDate: new Date('2024-09-01'),
      estimatedEndDate: new Date('2025-12-31'),
      status: 'active',
    },
  });

  console.log('Created 3 projects.');

  // ─── PERMITS ─────────────────────────────────────────────────────────────────────

  // Permit 1: Building permit for Sunset project — active and progressing
  const permit1 = await prisma.permit.create({
    data: {
      orgId: org.id,
      projectId: project1.id,
      permitNumber: 'BP-2024-00441',
      type: PermitType.BUILDING,
      status: PermitStatus.UNDER_REVIEW,
      title: 'Building Permit — Sunset Mixed-Use 6-Story',
      description: 'New construction of six-story mixed-use building. Ground floor 4,200 SF retail, floors 2-6 residential (48 units). Type IA construction, fully sprinklered.',
      jurisdiction: 'City of Los Angeles',
      agency: 'LA Department of Building and Safety',
      appliedDate: new Date('2024-04-10'),
      estimatedCost: 18500000,
      assigneeId: sarah.id,
      riskScore: 32,
      completionPercentage: 52,
      metadata: {
        squareFootage: 62400,
        stories: 6,
        units: 48,
        constructionType: 'Type IA',
        occupancyGroup: 'R-2/M',
        caseNumber: 'LADBS-2024-0441-BC',
      },
    },
  });

  // Permit 2: Electrical for Sunset project
  const permit2 = await prisma.permit.create({
    data: {
      orgId: org.id,
      projectId: project1.id,
      permitNumber: 'EP-2024-00892',
      type: PermitType.ELECTRICAL,
      status: PermitStatus.SUBMITTED,
      title: 'Electrical Permit — Sunset Mixed-Use',
      description: 'Main service entrance, distribution panels, branch circuits for all residential units and retail spaces. 2,000A 480/277V 3-phase service.',
      jurisdiction: 'City of Los Angeles',
      agency: 'LA Department of Building and Safety',
      appliedDate: new Date('2024-05-15'),
      estimatedCost: 485000,
      assigneeId: marcus.id,
      riskScore: 12,
      completionPercentage: 30,
      metadata: {
        serviceAmps: 2000,
        voltage: '480/277V',
        phases: 3,
      },
    },
  });

  // Permit 3: Grading permit for Culver City project — corrections needed
  const permit3 = await prisma.permit.create({
    data: {
      orgId: org.id,
      projectId: project2.id,
      permitNumber: 'GR-2024-00178',
      type: PermitType.GRADING,
      status: PermitStatus.CORRECTIONS_NEEDED,
      title: 'Grading Permit — Culver City Office Campus',
      description: 'Mass grading for 3-acre office campus. Cut approximately 8,400 CY, fill 2,100 CY. Includes erosion control and stormwater management plan.',
      jurisdiction: 'City of Culver City',
      agency: 'Culver City Public Works Department',
      appliedDate: new Date('2024-07-08'),
      estimatedCost: 92000,
      assigneeId: emily.id,
      riskScore: 58,
      completionPercentage: 20,
      metadata: {
        cutCubicYards: 8400,
        fillCubicYards: 2100,
        acreage: 3.0,
        soilsReport: 'GeoTech-2024-117',
      },
    },
  });

  // Permit 4: Fire protection for Sunset project
  const permit4 = await prisma.permit.create({
    data: {
      orgId: org.id,
      projectId: project1.id,
      type: PermitType.FIRE,
      status: PermitStatus.DRAFT,
      title: 'Fire Protection Permit — Sunset Mixed-Use',
      description: 'Design and installation of wet pipe fire sprinkler system throughout building per NFPA 13.',
      jurisdiction: 'City of Los Angeles',
      agency: 'LA Fire Department — Fire Prevention',
      estimatedCost: 210000,
      assigneeId: marcus.id,
      riskScore: 5,
      completionPercentage: 5,
      metadata: {
        systemType: 'Wet Pipe',
        standard: 'NFPA 13',
        headCount: 840,
      },
    },
  });

  // Permit 5: Environmental for Marina project
  const permit5 = await prisma.permit.create({
    data: {
      orgId: org.id,
      projectId: project3.id,
      type: PermitType.ENVIRONMENTAL,
      status: PermitStatus.PENDING_REVIEW,
      title: 'Coastal Development Permit — Marina del Rey',
      description: 'Coastal development permit for renovation of marina facility within the coastal zone. Includes biological survey, CEQA analysis, and coastal commission review.',
      jurisdiction: 'Los Angeles County',
      agency: 'California Coastal Commission',
      appliedDate: new Date('2024-10-01'),
      estimatedCost: 45000,
      assigneeId: emily.id,
      riskScore: 22,
      completionPercentage: 15,
      metadata: {
        coastalZone: true,
        ceqaClass: 'MND',
        biologicalSurveyDate: '2024-09-15',
      },
    },
  });

  console.log('Created 5 permits.');

  // ─── DOCUMENTS FOR PERMIT 1 ──────────────────────────────────────────────────────

  await prisma.document.createMany({
    data: [
      {
        orgId: org.id,
        permitId: permit1.id,
        name: 'Building Permit Application — Sunset Mixed-Use',
        fileName: 'BP-2024-00441-Application.pdf',
        fileUrl: 'https://storage.permitpro.app/docs/BP-2024-00441-Application.pdf',
        fileSize: 2048576,
        mimeType: 'application/pdf',
        category: DocumentCategory.APPLICATION,
        status: DocumentStatus.APPROVED,
        version: 1,
        uploadedById: sarah.id,
        notes: 'Initial application submitted April 10, 2024.',
      },
      {
        orgId: org.id,
        permitId: permit1.id,
        name: 'Architectural Plans — Floor Plans All Levels',
        fileName: 'A2.0-A2.6-FloorPlans-Rev3.pdf',
        fileUrl: 'https://storage.permitpro.app/docs/A2.0-A2.6-FloorPlans-Rev3.pdf',
        fileSize: 15728640,
        mimeType: 'application/pdf',
        category: DocumentCategory.PLAN,
        status: DocumentStatus.APPROVED,
        version: 3,
        uploadedById: sarah.id,
        notes: 'Revision 3 addressing LADBS first correction notice.',
        extractedData: {
          pageCount: 24,
          scale: '1/8" = 1\'',
          drawingDate: '2024-06-12',
        },
        aiClassification: 'Architectural Floor Plans',
      },
      {
        orgId: org.id,
        permitId: permit1.id,
        name: 'Structural Engineering Calculations',
        fileName: 'Structural-Calcs-Rev2.pdf',
        fileUrl: 'https://storage.permitpro.app/docs/Structural-Calcs-Rev2.pdf',
        fileSize: 8388608,
        mimeType: 'application/pdf',
        category: DocumentCategory.ENGINEERING,
        status: DocumentStatus.APPROVED,
        version: 2,
        uploadedById: marcus.id,
        notes: 'Stamped and signed by EOR. Includes lateral and gravity analysis.',
        aiClassification: 'Structural Engineering Report',
      },
      {
        orgId: org.id,
        permitId: permit1.id,
        name: 'ALTA/NSPS Land Title Survey',
        fileName: 'Survey-1420-SunsetBlvd-2024.pdf',
        fileUrl: 'https://storage.permitpro.app/docs/Survey-1420-SunsetBlvd-2024.pdf',
        fileSize: 4194304,
        mimeType: 'application/pdf',
        category: DocumentCategory.SURVEY,
        status: DocumentStatus.APPROVED,
        version: 1,
        uploadedById: sarah.id,
        notes: 'Certified survey by licensed land surveyor. Dated March 2024.',
        aiClassification: 'Land Survey',
      },
      {
        orgId: org.id,
        permitId: permit1.id,
        name: 'Phase I Environmental Site Assessment',
        fileName: 'PhaseI-ESA-1420Sunset.pdf',
        fileUrl: 'https://storage.permitpro.app/docs/PhaseI-ESA-1420Sunset.pdf',
        fileSize: 5242880,
        mimeType: 'application/pdf',
        category: DocumentCategory.ENVIRONMENTAL,
        status: DocumentStatus.APPROVED,
        version: 1,
        uploadedById: marcus.id,
        notes: 'No RECs identified. Phase II not required.',
        aiClassification: 'Environmental Assessment',
      },
      {
        orgId: org.id,
        permitId: permit1.id,
        name: "Contractor's General Liability Insurance Certificate",
        fileName: 'GLI-Certificate-Turner-2024.pdf',
        fileUrl: 'https://storage.permitpro.app/docs/GLI-Certificate-Turner-2024.pdf',
        fileSize: 512000,
        mimeType: 'application/pdf',
        category: DocumentCategory.INSURANCE,
        status: DocumentStatus.APPROVED,
        version: 1,
        uploadedById: emily.id,
        expirationDate: new Date('2025-03-31'),
        notes: 'Turner Construction. $5M GL, $10M umbrella.',
      },
      {
        orgId: org.id,
        permitId: permit1.id,
        name: "LADBS Plan Check Correction Notice #1",
        fileName: 'CorrectionNotice1-BP-2024-00441.pdf',
        fileUrl: 'https://storage.permitpro.app/docs/CorrectionNotice1-BP-2024-00441.pdf',
        fileSize: 307200,
        mimeType: 'application/pdf',
        category: DocumentCategory.CORRESPONDENCE,
        status: DocumentStatus.APPROVED,
        version: 1,
        uploadedById: sarah.id,
        notes: '23 corrections issued. Primarily related to accessibility compliance and fire egress.',
        aiClassification: 'Agency Correspondence',
      },
      {
        orgId: org.id,
        permitId: permit1.id,
        name: 'Response to Correction Notice #1',
        fileName: 'CorrectionResponse1-BP-2024-00441.pdf',
        fileUrl: 'https://storage.permitpro.app/docs/CorrectionResponse1-BP-2024-00441.pdf',
        fileSize: 1048576,
        mimeType: 'application/pdf',
        category: DocumentCategory.CORRESPONDENCE,
        status: DocumentStatus.PENDING,
        version: 1,
        uploadedById: sarah.id,
        notes: 'Uploaded June 28. Under plan check review.',
      },
    ],
  });

  console.log('Created documents for permit 1.');

  // ─── DOCUMENTS FOR PERMIT 3 ──────────────────────────────────────────────────────

  await prisma.document.createMany({
    data: [
      {
        orgId: org.id,
        permitId: permit3.id,
        name: 'Grading Plan — Culver City Office Campus',
        fileName: 'GradingPlan-8800Venice-Rev1.pdf',
        fileUrl: 'https://storage.permitpro.app/docs/GradingPlan-8800Venice-Rev1.pdf',
        fileSize: 6291456,
        mimeType: 'application/pdf',
        category: DocumentCategory.PLAN,
        status: DocumentStatus.REJECTED,
        version: 1,
        uploadedById: emily.id,
        notes: 'Rejected — drainage calculations incomplete. Revision required.',
      },
      {
        orgId: org.id,
        permitId: permit3.id,
        name: 'Soils Report — GeoTech-2024-117',
        fileName: 'SoilsReport-GeoTech-2024-117.pdf',
        fileUrl: 'https://storage.permitpro.app/docs/SoilsReport-GeoTech-2024-117.pdf',
        fileSize: 9437184,
        mimeType: 'application/pdf',
        category: DocumentCategory.ENGINEERING,
        status: DocumentStatus.APPROVED,
        version: 1,
        uploadedById: emily.id,
        notes: 'Approved. Expansion index 35, sulfate content low.',
      },
    ],
  });

  // ─── CHECKLIST ITEMS FOR PERMIT 1 ────────────────────────────────────────────────

  const cl1 = await prisma.checklistItem.create({
    data: {
      permitId: permit1.id,
      title: 'Submit building permit application to LADBS',
      description: 'Complete and submit LADBS permit application form with all required attachments.',
      status: ChecklistItemStatus.COMPLETED,
      category: 'Application',
      order: 1,
      assigneeId: sarah.id,
      completedAt: new Date('2024-04-10'),
      completedById: sarah.id,
    },
  });

  const cl2 = await prisma.checklistItem.create({
    data: {
      permitId: permit1.id,
      title: 'Pay initial plan check fee',
      description: 'Pay LADBS plan check fee. Estimated $42,500 based on project valuation.',
      status: ChecklistItemStatus.COMPLETED,
      category: 'Application',
      order: 2,
      assigneeId: sarah.id,
      completedAt: new Date('2024-04-10'),
      completedById: sarah.id,
    },
  });

  const cl3 = await prisma.checklistItem.create({
    data: {
      permitId: permit1.id,
      title: 'Upload complete architectural drawing set',
      description: 'Upload all architectural sheets A0.0 through A9.0 including site plan, floor plans, elevations, sections, and details.',
      status: ChecklistItemStatus.COMPLETED,
      category: 'Documents',
      order: 3,
      assigneeId: sarah.id,
      completedAt: new Date('2024-04-10'),
      completedById: sarah.id,
    },
  });

  await prisma.checklistItem.create({
    data: {
      permitId: permit1.id,
      title: 'Upload structural engineering calculations and drawings',
      description: 'Engineer-of-record stamped structural calculations and all structural sheets.',
      status: ChecklistItemStatus.COMPLETED,
      category: 'Documents',
      order: 4,
      assigneeId: marcus.id,
      completedAt: new Date('2024-04-12'),
      completedById: marcus.id,
    },
  });

  await prisma.checklistItem.create({
    data: {
      permitId: permit1.id,
      title: 'Upload MEP coordination drawings',
      description: 'Mechanical, electrical, and plumbing coordination drawings showing routing and clearances.',
      status: ChecklistItemStatus.IN_PROGRESS,
      category: 'Documents',
      order: 5,
      assigneeId: marcus.id,
      dueDate: new Date('2024-08-15'),
    },
  });

  await prisma.checklistItem.create({
    data: {
      permitId: permit1.id,
      title: 'Receive and review plan check correction notice',
      description: 'Review all corrections from LADBS plan checker and distribute to design team.',
      status: ChecklistItemStatus.COMPLETED,
      category: 'Plan Check',
      order: 6,
      assigneeId: sarah.id,
      completedAt: new Date('2024-05-28'),
      completedById: sarah.id,
    },
  });

  await prisma.checklistItem.create({
    data: {
      permitId: permit1.id,
      title: 'Address accessibility corrections (ADA)',
      description: 'Revise plans to address all ADA corrections in CN1. Items 1-8 relate to accessible route and Type A unit requirements.',
      status: ChecklistItemStatus.COMPLETED,
      category: 'Plan Check',
      order: 7,
      assigneeId: sarah.id,
      completedAt: new Date('2024-06-20'),
      completedById: sarah.id,
      parentItemId: cl1.id,
    },
  });

  await prisma.checklistItem.create({
    data: {
      permitId: permit1.id,
      title: 'Address fire egress corrections',
      description: 'Revise exit corridor widths and exit signage per CN1 Items 9-15.',
      status: ChecklistItemStatus.COMPLETED,
      category: 'Plan Check',
      order: 8,
      assigneeId: marcus.id,
      completedAt: new Date('2024-06-25'),
      completedById: marcus.id,
    },
  });

  await prisma.checklistItem.create({
    data: {
      permitId: permit1.id,
      title: 'Resubmit corrected plans to LADBS',
      description: 'Upload revision 3 plans addressing all items in correction notice 1.',
      status: ChecklistItemStatus.COMPLETED,
      category: 'Plan Check',
      order: 9,
      assigneeId: sarah.id,
      completedAt: new Date('2024-06-28'),
      completedById: sarah.id,
    },
  });

  await prisma.checklistItem.create({
    data: {
      permitId: permit1.id,
      title: 'Obtain second plan check approval',
      description: 'Await LADBS plan check sign-off on revision 3 plans.',
      status: ChecklistItemStatus.IN_PROGRESS,
      category: 'Plan Check',
      order: 10,
      assigneeId: sarah.id,
      dueDate: new Date('2024-08-30'),
    },
  });

  await prisma.checklistItem.create({
    data: {
      permitId: permit1.id,
      title: 'Confirm contractor license in good standing',
      description: 'Verify Turner Construction California license active and in good standing via CSLB.',
      status: ChecklistItemStatus.COMPLETED,
      category: 'Compliance',
      order: 11,
      assigneeId: emily.id,
      completedAt: new Date('2024-04-08'),
      completedById: emily.id,
    },
  });

  await prisma.checklistItem.create({
    data: {
      permitId: permit1.id,
      title: "Verify contractor's workers compensation insurance",
      description: 'Obtain and upload workers comp certificate of insurance. Minimum $2M.',
      status: ChecklistItemStatus.NOT_STARTED,
      category: 'Compliance',
      order: 12,
      assigneeId: emily.id,
      dueDate: new Date('2024-09-01'),
    },
  });

  console.log('Created checklist items for permit 1.');

  // ─── CHECKLIST ITEMS FOR PERMIT 3 ────────────────────────────────────────────────

  await prisma.checklistItem.createMany({
    data: [
      {
        permitId: permit3.id,
        title: 'Submit grading permit application',
        status: ChecklistItemStatus.COMPLETED,
        category: 'Application',
        order: 1,
        assigneeId: emily.id,
        completedAt: new Date('2024-07-08'),
        completedById: emily.id,
      },
      {
        permitId: permit3.id,
        title: 'Upload soils report',
        status: ChecklistItemStatus.COMPLETED,
        category: 'Documents',
        order: 2,
        assigneeId: emily.id,
        completedAt: new Date('2024-07-10'),
        completedById: emily.id,
      },
      {
        permitId: permit3.id,
        title: 'Revise grading plan — drainage calculations',
        description: 'Address DPW correction: provide complete drainage analysis per Culver City Stormwater Management Standards.',
        status: ChecklistItemStatus.IN_PROGRESS,
        category: 'Plan Check',
        order: 3,
        assigneeId: emily.id,
        dueDate: new Date('2024-08-20'),
      },
      {
        permitId: permit3.id,
        title: 'Submit SWPPP (Stormwater Pollution Prevention Plan)',
        description: 'Prepare and submit SWPPP per Construction General Permit requirements.',
        status: ChecklistItemStatus.NOT_STARTED,
        category: 'Compliance',
        order: 4,
        assigneeId: emily.id,
        dueDate: new Date('2024-09-01'),
      },
    ],
  });

  console.log('Created checklist items for permit 3.');

  // ─── INSPECTIONS FOR PERMIT 1 ────────────────────────────────────────────────────

  await prisma.inspection.create({
    data: {
      permitId: permit1.id,
      type: 'Pre-Construction Site Meeting',
      status: InspectionStatus.PASSED,
      scheduledDate: new Date('2024-07-15T09:00:00'),
      completedDate: new Date('2024-07-15T10:30:00'),
      inspectorName: 'Inspector R. Williams',
      inspectorPhone: '213-555-0099',
      location: '1420 Sunset Blvd, Los Angeles, CA 90026',
      notes: 'Site access confirmed. Erosion control measures in place. Grading stakes set.',
      result: 'Approved to proceed with demolition of existing structure.',
    },
  });

  await prisma.inspection.create({
    data: {
      permitId: permit1.id,
      type: 'Foundation Excavation Inspection',
      status: InspectionStatus.SCHEDULED,
      scheduledDate: new Date('2024-09-05T08:00:00'),
      inspectorName: 'Inspector R. Williams',
      inspectorPhone: '213-555-0099',
      location: '1420 Sunset Blvd, Los Angeles, CA 90026',
      notes: 'Scheduled for foundation excavation and bearing soil verification.',
    },
  });

  console.log('Created inspections for permit 1.');

  // ─── FEES FOR PERMIT 1 ───────────────────────────────────────────────────────────

  await prisma.fee.create({
    data: {
      permitId: permit1.id,
      description: 'Plan Check Fee — Initial Submittal',
      amount: 42500,
      status: FeeStatus.PAID,
      dueDate: new Date('2024-04-10'),
      paidDate: new Date('2024-04-10'),
      receiptUrl: 'https://storage.permitpro.app/receipts/LADBS-PC-2024-0441-receipt.pdf',
      category: 'Plan Check',
    },
  });

  await prisma.fee.create({
    data: {
      permitId: permit1.id,
      description: 'Plan Check Fee — Recheck (Revision 1)',
      amount: 8500,
      status: FeeStatus.PAID,
      dueDate: new Date('2024-07-01'),
      paidDate: new Date('2024-06-28'),
      receiptUrl: 'https://storage.permitpro.app/receipts/LADBS-PC-2024-0441-rev1-receipt.pdf',
      category: 'Plan Check',
    },
  });

  await prisma.fee.create({
    data: {
      permitId: permit1.id,
      description: 'Building Permit Issuance Fee',
      amount: 128000,
      status: FeeStatus.PENDING,
      dueDate: new Date('2024-10-01'),
      category: 'Permit Issuance',
    },
  });

  console.log('Created fees for permit 1.');

  // ─── DEADLINES FOR PERMIT 1 ──────────────────────────────────────────────────────

  await prisma.deadline.create({
    data: {
      permitId: permit1.id,
      title: 'Plan Check Approval Target Date',
      dueDate: new Date('2024-08-30'),
      reminderDays: [14, 7, 1],
      status: 'active',
    },
  });

  await prisma.deadline.create({
    data: {
      permitId: permit1.id,
      title: 'Permit Issuance Fee Payment Deadline',
      dueDate: new Date('2024-10-01'),
      reminderDays: [30, 14, 7, 1],
      status: 'active',
    },
  });

  console.log('Created deadlines for permit 1.');

  // ─── COMMENTS ────────────────────────────────────────────────────────────────────

  const comment1 = await prisma.comment.create({
    data: {
      permitId: permit1.id,
      userId: sarah.id,
      content: 'Just got off the phone with LADBS plan checker Jennifer Tran. She said the revision 3 resubmittal looks good. She\'s targeting a decision by end of August but cannot commit to a date. Will follow up weekly.',
      attachments: [],
    },
  });

  await prisma.comment.create({
    data: {
      permitId: permit1.id,
      userId: marcus.id,
      content: 'MEP coordination drawings are 80% complete. Expecting final version from the engineers by August 8th.',
      attachments: [],
      parentCommentId: comment1.id,
    },
  });

  await prisma.comment.create({
    data: {
      permitId: permit3.id,
      userId: emily.id,
      content: 'Culver City DPW issued corrections requiring a full drainage study per their 2022 Stormwater Manual. Engaging GeoTech to prepare revised drainage calculations. Estimate 3 weeks to complete.',
      attachments: [],
    },
  });

  // ─── ACTIVITY LOG ────────────────────────────────────────────────────────────────

  await prisma.activity.createMany({
    data: [
      {
        orgId: org.id,
        permitId: permit1.id,
        userId: sarah.id,
        action: 'permit.created',
        entityType: 'permit',
        entityId: permit1.id,
        metadata: { permitNumber: 'BP-2024-00441', type: 'BUILDING' },
      },
      {
        orgId: org.id,
        permitId: permit1.id,
        userId: sarah.id,
        action: 'permit.status_changed',
        entityType: 'permit',
        entityId: permit1.id,
        metadata: { from: 'DRAFT', to: 'SUBMITTED' },
      },
      {
        orgId: org.id,
        permitId: permit1.id,
        userId: sarah.id,
        action: 'permit.status_changed',
        entityType: 'permit',
        entityId: permit1.id,
        metadata: { from: 'SUBMITTED', to: 'UNDER_REVIEW' },
      },
      {
        orgId: org.id,
        permitId: permit1.id,
        userId: sarah.id,
        action: 'document.uploaded',
        entityType: 'document',
        entityId: permit1.id,
        metadata: { documentName: 'Architectural Plans — Floor Plans All Levels', category: 'PLAN' },
      },
      {
        orgId: org.id,
        permitId: permit3.id,
        userId: emily.id,
        action: 'permit.status_changed',
        entityType: 'permit',
        entityId: permit3.id,
        metadata: { from: 'UNDER_REVIEW', to: 'CORRECTIONS_NEEDED' },
      },
      {
        orgId: org.id,
        permitId: permit3.id,
        userId: emily.id,
        action: 'document.uploaded',
        entityType: 'document',
        entityId: permit3.id,
        metadata: { documentName: 'Grading Plan — Culver City Office Campus', category: 'PLAN' },
      },
      {
        orgId: org.id,
        permitId: permit2.id,
        userId: marcus.id,
        action: 'permit.created',
        entityType: 'permit',
        entityId: permit2.id,
        metadata: { type: 'ELECTRICAL' },
      },
      {
        orgId: org.id,
        permitId: permit5.id,
        userId: emily.id,
        action: 'permit.created',
        entityType: 'permit',
        entityId: permit5.id,
        metadata: { type: 'ENVIRONMENTAL' },
      },
    ],
  });

  console.log('Created activity log entries.');

  // ─── CONTACTS ────────────────────────────────────────────────────────────────────

  await prisma.contact.createMany({
    data: [
      {
        orgId: org.id,
        name: 'Jennifer Tran',
        email: 'jtran@ladbs.lacity.org',
        phone: '213-482-0440',
        company: 'LA Department of Building and Safety',
        role: 'Plan Check Engineer',
        notes: 'Assigned plan checker for BP-2024-00441. Responsive via email. Best reached Tuesday-Thursday.',
      },
      {
        orgId: org.id,
        name: 'Robert Castellano',
        email: 'rcastellano@culvercity.org',
        phone: '310-253-5600',
        company: 'City of Culver City Public Works',
        role: 'Grading Plan Checker',
        notes: 'Assigned for GR-2024-00178. Requested drainage study revision.',
      },
      {
        orgId: org.id,
        name: 'David Park',
        email: 'd.park@turnerconstruction.com',
        phone: '213-555-0300',
        company: 'Turner Construction',
        role: 'Project Manager',
        notes: 'GC project manager for Sunset Mixed-Use. Weekly progress calls every Monday.',
      },
    ],
  });

  console.log('Created contacts.');

  // ─── CHECKLIST TEMPLATE ──────────────────────────────────────────────────────────

  await prisma.checklistTemplate.create({
    data: {
      orgId: org.id,
      name: 'Standard Building Permit — City of Los Angeles',
      permitType: PermitType.BUILDING,
      jurisdiction: 'City of Los Angeles',
      items: [
        { title: 'Submit permit application to LADBS', category: 'Application', order: 1 },
        { title: 'Pay initial plan check fee', category: 'Application', order: 2 },
        { title: 'Upload complete architectural drawing set', category: 'Documents', order: 3 },
        { title: 'Upload structural engineering calculations', category: 'Documents', order: 4 },
        { title: 'Upload civil/grading plans', category: 'Documents', order: 5 },
        { title: 'Upload MEP coordination drawings', category: 'Documents', order: 6 },
        { title: 'Upload ALTA/NSPS survey', category: 'Documents', order: 7 },
        { title: 'Upload soils/geotechnical report', category: 'Documents', order: 8 },
        { title: 'Upload contractor license', category: 'Compliance', order: 9 },
        { title: "Upload contractor's general liability insurance", category: 'Compliance', order: 10 },
        { title: "Upload contractor's workers compensation insurance", category: 'Compliance', order: 11 },
        { title: 'Receive plan check correction notice', category: 'Plan Check', order: 12 },
        { title: 'Distribute corrections to design team', category: 'Plan Check', order: 13 },
        { title: 'Address all plan check corrections', category: 'Plan Check', order: 14 },
        { title: 'Resubmit corrected plans', category: 'Plan Check', order: 15 },
        { title: 'Obtain plan check approval', category: 'Plan Check', order: 16 },
        { title: 'Pay permit issuance fee', category: 'Issuance', order: 17 },
        { title: 'Obtain issued permit', category: 'Issuance', order: 18 },
        { title: 'Post permit on job site', category: 'Construction', order: 19 },
        { title: 'Schedule pre-construction inspection', category: 'Construction', order: 20 },
      ],
    },
  });

  console.log('Created checklist template.');

  console.log('\nSeed complete!');
  console.log(`  Org: ${org.name} (${org.id})`);
  console.log(`  Users: Sarah Chen, Marcus Johnson, Emily Rodriguez`);
  console.log(`  Projects: ${project1.name}, ${project2.name}, ${project3.name}`);
  console.log(`  Permits: 5 across 3 projects`);
  console.log(`  Documents: 10, Checklist Items: 16, Inspections: 2, Fees: 3, Deadlines: 2`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
