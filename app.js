// ─────────────────────────────────────────────────────────────────────────────
// NPMS Enterprise — app.js  v4.2  (Go-Live · Centre Commercial Madina)
// NOVATIS GLOBAL SARLU · Conakry · Guinea
// Production-hardened v4.2 — pre-launch hotfixes applied
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────
const PREF_KEY    = 'npms_enterprise_preferences';
const DEMO_KEY    = 'npms_demo_mode';
const APP_VERSION = '4.2';

// ── Madina property identity ──────────────────────────────────────────────────
const PROPERTY = {
  name:     'Centre Commercial Madina',
  company:  'NOVATIS GLOBAL SARLU',
  city:     'Conakry, République de Guinée',
  phone:    '+224 628 00 00 00',
  rccm:     'RCCM/GN-KA/2020/B/XXXX',
  nif:      'NIF XXXXXXXX',
  currency: 'GNF',
  locale:   'fr-FR'
};

// ── Module registry ───────────────────────────────────────────────────────────
const MODULES = [
  { id:'dashboard',   group:'Core',           en:'Dashboard',            fr:'Tableau de bord'      },
  { id:'spaces',      group:'Core',           en:'Spaces',               fr:'Espaces'               },
  { id:'tenants',     group:'Core',           en:'Tenants',              fr:'Locataires'            },
  { id:'contracts',   group:'Core',           en:'Contracts',            fr:'Contrats'              },
  { id:'rent',        group:'Finance',        en:'Rent Collection',      fr:'Collecte des loyers'   },
  { id:'receipts',    group:'Finance',        en:'Receipts',             fr:'Reçus'                 },
  { id:'toilets',     group:'Finance',        en:'Toilet Revenue',       fr:'Recettes WC'           },
  { id:'finance',     group:'Finance',        en:'Finance',              fr:'Finances'              },
  { id:'dailyclosing',group:'Finance',        en:'Daily Closing',        fr:'Clôture Journalière'  },
  { id:'boardreport', group:'Finance',        en:'Board Report',         fr:'Rapport de Direction' },
  { id:'reports',     group:'Finance',        en:'Reports',              fr:'Rapports'              },
  { id:'maintenance', group:'Operations',     en:'Maintenance',          fr:'Maintenance'           },
  { id:'alerts',      group:'Operations',     en:'Alerts',               fr:'Alertes'               },
  { id:'users',       group:'Administration', en:'Users & Roles',        fr:'Utilisateurs'          },
  { id:'data',        group:'Administration', en:'Data & Backup',        fr:'Données & Sauvegarde'  },
  { id:'settings',    group:'Administration', en:'Settings',             fr:'Paramètres'            }
];

// ── Table schema registry ─────────────────────────────────────────────────────
const TABLES = [
  ['inventaire',      'Spaces',             'Core',           ['codeespace','typeespace','zone','surface','loyermensuel','nomlocataireofficiel','nomoccupantreel','nomcommercial','activite','telephone','statut','etatmaintenance','risque','photourl','documenturl']],
  ['locataires',      'Tenants',            'Core',           ['nom','occupantreel','commerce','telephone','activite','documentid','risque','statut','communication','notes']],
  ['contrats',        'Contracts',          'Core',           ['numero','boutiquecode','locataire','datedebut','datefin','montantloyer','caution','statut','renouvellement','documenturl']],
  ['loyers',          'Rent Schedule',      'Finance',        ['boutiquecode','locataire','mois','duedate','montant','paye','penalite','solde','statut']],
  ['paiements',       'Payments & Receipts','Finance',        ['date','reference','numero_recu','payeur','source','espace','montant','mode','statut','duplicata']],
  ['revenus',         'Additional Revenue', 'Finance',        ['date','source','description','montant','mode','statut']],
  ['recettes_wc',     'Toilet Revenue',     'Finance',        ['date','collecteur','montant','sessions','statut']],
  ['depenses',        'Expenses',           'Finance',        ['date','categorie','description','fournisseur','montant','modepaiement','statut']],
  ['caisse',          'Cash Register',      'Finance',        ['date','caissier','soldeouverture','entrees','sorties','soldetheorique','cashreel','ecart','statut']],
  ['mouvements_caisse','Cash Movements',    'Finance',        ['dateheure','caissedate','type','libelle','entree','sortie','soldeapres','statut']],
  ['depots',          'Bank Deposits',      'Finance',        ['date','reference','banque','montant','deposant','statut']],
  ['mouvements_banque','Bank Movements',    'Finance',        ['dateheure','banque','type','reference','entree','sortie','soldeapres','statut']],
  ['maintenance',     'Maintenance',        'Operations',     ['date','espace','demandeur','description','contractor','cost','statut','priority','closedate']],
  ['communications',  'Communication Logs', 'Operations',     ['date','locataire','canal','sujet','details','utilisateur']],
  ['profiles',        'Users & Roles',      'Administration', ['email','fullname','role','statut']],
  ['activity_logs',   'Activity Logs',      'Administration', ['date','action','module','utilisateur','details']],
  ['archives',        'Archives',           'Administration', ['titre','type','reference','date','statut']]
];

const MONEY_FIELDS = new Set(['montant','paye','solde','loyermensuel','montantloyer','caution','penalite','soldeouverture','entrees','sorties','soldetheorique','cashreel','ecart','entree','sortie','soldeapres','cost']);
const DATE_FIELDS  = new Set(['date','duedate','datedebut','datefin','closedate','dateheure']);

const LEGACY_MAP = {
  espaces:'inventaire', inventory:'inventaire', tenants:'locataires',
  payments:'paiements', expenses:'depenses', other:'revenus',
  mouvementsCaisse:'mouvements_caisse', mouvementsBanque:'mouvements_banque'
};
const FIELD_MAP = {
  Code_Espace:'codeespace', Type_Espace:'typeespace', Zone:'zone', 'Surface m²':'surface',
  'Loyer_Mensuel (GNF)':'loyermensuel','Nom_Locataire Officiel':'nomlocataireofficiel',
  'Nom_Occupant Réel':'nomoccupantreel', Nom_Commercial:'nomcommercial','Activité':'activite',
  'Téléphone':'telephone', Statut:'statut','État_Espace':'etatmaintenance', Type_Anomalie:'risque',
  boutiqueCode:'boutiquecode', montantLoyer:'montantloyer', modePaiement:'modepaiement',
  soldeOuverture:'soldeouverture', soldeTheorique:'soldetheorique', cashReel:'cashreel',
  dateHeure:'dateheure', caisseDate:'caissedate', soldeApres:'soldeapres',
  Date_Paiement:'date', Référence:'reference','ID_Reçu (auto)':'numero_recu',
  'Nom_Locataire (auto)':'payeur','Montant_Versé (GNF)':'montant',
  Mode_Paiement:'mode','Statut_Paiement (auto)':'statut', Mois_Loyer:'mois',
  'Total_Dû (auto/GNF)':'montant','Solde_Restant (auto/GNF)':'solde'
};

const LABELS = {
  codeespace:['Space code','Code espace'], typeespace:['Type','Type'], zone:['Zone','Zone'], surface:['Area m²','Surface m²'],
  loyermensuel:['Monthly rent','Loyer mensuel'], nomlocataireofficiel:['Official tenant','Locataire officiel'],
  nomoccupantreel:['Real occupant','Occupant réel'], nomcommercial:['Business name','Nom commercial'],
  activite:['Activity','Activité'], telephone:['Phone','Téléphone'], statut:['Status','Statut'],
  etatmaintenance:['Condition','État'], risque:['Risk','Risque'], photourl:['Photo URL','URL photo'],
  documenturl:['Document URL','URL document'], nom:['Name','Nom'], occupantreel:['Real occupant','Occupant réel'],
  commerce:['Business','Commerce'], documentid:['ID / CNI','Pièce ID'], communication:['Notes','Notes'],
  notes:['Notes','Notes'], numero:['Contract no.','N° contrat'], boutiquecode:['Space','Espace'],
  locataire:['Tenant','Locataire'], datedebut:['Start','Début'], datefin:['End','Fin'],
  montantloyer:['Rent','Loyer'], caution:['Deposit','Caution'], renouvellement:['Renewal','Renouvellement'],
  mois:['Month','Mois'], duedate:['Due date','Échéance'], montant:['Amount','Montant'],
  paye:['Paid','Payé'], penalite:['Penalty','Pénalité'], solde:['Balance','Solde'],
  date:['Date','Date'], reference:['Reference','Référence'], numero_recu:['Receipt no.','N° reçu'],
  payeur:['Payer','Payeur'], source:['Source','Source'], espace:['Space','Espace'],
  mode:['Mode','Mode'], duplicata:['Duplicate','Duplicata'], description:['Description','Description'],
  fournisseur:['Supplier','Fournisseur'], modepaiement:['Payment mode','Mode paiement'],
  caissier:['Cashier','Caissier'], soldeouverture:['Opening','Solde ouverture'],
  entrees:['Inflows','Entrées'], sorties:['Outflows','Sorties'],
  soldetheorique:['Expected','Solde théorique'], cashreel:['Actual cash','Cash réel'],
  ecart:['Variance','Écart'], dateheure:['Date/time','Date/heure'],
  caissedate:['Cash day','Jour caisse'], libelle:['Label','Libellé'],
  entree:['In','Entrée'], sortie:['Out','Sortie'], soldeapres:['After','Solde après'],
  banque:['Bank','Banque'], deposant:['Depositor','Déposant'],
  demandeur:['Requester','Demandeur'], contractor:['Contractor','Prestataire'],
  cost:['Cost','Coût'], priority:['Priority','Priorité'], closedate:['Closed','Date clôture'],
  canal:['Channel','Canal'], sujet:['Subject','Sujet'], utilisateur:['User','Utilisateur'],
  email:['Email','Email'], fullname:['Full name','Nom complet'], role:['Role','Rôle'],
  action:['Action','Action'], module:['Module','Module'], details:['Details','Détails'],
  titre:['Title','Titre'], collecteur:['Collector','Collecteur'], sessions:['Sessions','Sessions'],
  categorie:['Category','Catégorie']
};

const I18N = {
  en:{
    // System
    app:'CENTRE COMMERCIAL MADINA', edition:'NOVATIS GLOBAL SARLU',
    save:'Save', login:'Sign in', logout:'Sign out', refresh:'Refresh',
    add:'Add', edit:'Edit', cancel:'Cancel', confirm:'Confirm', close:'Close',
    exportJson:'Export JSON', importJson:'Import JSON', print:'Print', pdf:'PDF',
    duplicate:'Duplicate copy',
    loading:'Loading…', empty:'No records.', demo:'DEMO MODE', production:'LIVE',
    quickActions:'Quick actions',
    noProfile:'No profile found for your account. Contact your administrator.',
    swUpdate:'New version available — refresh to update.',
    // Alert messages
    contractExpiry:'contracts expiring within 60 days',
    overdueRent:'spaces with overdue rent',
    maintenanceOpen:'open maintenance requests',
    // Dashboard
    execCenter:'Executive command center',
    collectRent:'Collect rent payment',
    wcRevenue:'Toilet revenue',
    report:'Report',
    totalRevenue:'Total revenue', rentWcOther:'Rent + WC + other',
    occupancyRate:'Occupancy rate',
    arrears:'Arrears', unpaidBalances:'Unpaid balances',
    netResult:'Net result', revMinusExp:'Revenue minus expenses',
    rentCollected:'Rent collected', thisMonth:'This month',
    wcTotal:'Toilet revenue', toilets:'Toilets',
    otherRevenue:'Other revenue', misc:'Advertising & misc',
    expenses:'Expenses', opCosts:'Operating costs',
    manageSpaces:'Manage spaces', tenantProfiles:'Tenants',
    contracts:'Contracts', maintenance:'Maintenance',
    revenueTrend:'Revenue trend', last6:'Last 6 periods',
    overdueRents:'Overdue rents', tenantCount:'tenants',
    recentPayments:'Recent payments', confirmed:'Confirmed',
    monthlyPerf:'Monthly performance',
    rentDue:'Rent due', rentPaid:'Rent paid',
    additionalRev:'Additional revenue', totalRevLabel:'Total revenue',
    profitLoss:'Profit / loss',
    // Spaces
    spacesTitle:'Spaces', spacesSub:'Shops, containers, kiosks, tables, toilets.',
    totalSpaces:'Total spaces', portfolio:'Portfolio',
    occupied:'Occupied', active:'Active',
    vacant:'Vacant', available:'Available',
    maintenanceIssues:'Maintenance issues', trackRepairs:'Track repairs',
    typeBreakdown:'Space type breakdown',
    spaceCode:'Code', type:'Type', zone:'Zone', area:'Area', tenant:'Tenant',
    monthlyRent:'Monthly rent', status:'Status', condition:'Condition', actions:'Actions',
    // Tenants
    tenantsTitle:'Tenants', tenantsSub:'Profiles, risk, history, communications.',
    tenantProf:'Tenant profiles', registered:'Registered',
    highRisk:'High risk', watchList:'Watch list',
    activeContracts:'Active contracts', inProgress:'In progress',
    commsLogged:'Communications', logged:'Logged',
    name:'Name', business:'Business', phone:'Phone', activity:'Activity',
    idDoc:'ID / CNI', risk:'Risk', totalPaid:'Total paid',
    contactBtn:'Contact',
    // Contracts
    contractsTitle:'Contracts', contractsSub:'Leases, start/end dates, renewals.',
    activeContr:'Active contracts', inForce:'In force',
    expiringSoon:'Expiring soon', within60:'Within 60 days',
    expired:'Expired', toRenew:'To renew',
    totalDeposits:'Total deposits', guarantees:'Guarantees',
    contractNo:'Contract no.', space:'Space', start:'Start', end:'End',
    rent:'Rent', deposit:'Deposit', renewal:'Renewal', daysLeft:'Days left',
    expiringWarn:'contract(s) expiring within 60 days',
    expiredWarn:'contract(s) expired — renew urgently',
    // Rent
    rentTitle:'Rent collection', rentSub:'Schedule, partial payments, penalties, monthly closing.',
    rentScheduled:'Rent scheduled', totalDue:'Total due',
    collected:'Collected', payments:'Payments',
    penalties:'Penalties', lateFees:'Late fees',
    outstanding:'Outstanding',
    generateMonth:'⚡ Generate month', closeMonth:'🔒 Monthly closing',
    overdueAlert:'tenant(s) with unpaid balance — Total',
    month:'Month', dueDate:'Due date', paid:'Paid', penalty:'Penalty',
    balance:'Balance', progress:'Progress', payBtn:'💳 Pay',
    arrearsQueue:'Arrears queue',
    // Receipts
    receiptsTitle:'Receipt system', receiptsSub:'Preview, print, duplicate, search.',
    date:'Date', receiptNo:'Receipt no.', payer:'Payer',
    amount:'Amount', mode:'Mode', preview:'👁 Preview',
    // Toilets
    toiletsTitle:'Toilet revenue', toiletsSub:'Daily WC collection tracking.',
    todayRevenue:"Today's revenue", todaySessions:'Today\'s sessions',
    monthTotal:'This month', totalEntries:'Total entries', history:'History',
    addToilet:'➕ Add today\'s entry', collector:'Collector', sessions:'Sessions',
    // Finance
    financeTitle:'Finance', financeSub:'Cash, expenses, bank deposits, reconciliation.',
    rentRevenue:'Rent revenue', additionalRevenue:'Additional revenue', incToilets:'Including toilets',
    cashRegister:'Cash register', actualCash:'Actual cash',
    bankBalance:'Bank balance', movementBal:'Movement balance',
    bankDeposits:'Bank deposits', preparedPosted:'Prepared/posted',
    reconcGaps:'Reconciliation gaps', cashVariance:'Cash variance',
    expensesTitle:'Expenses', cashClose:'Cash register closing',
    bankDepositsTitle:'Bank deposits',
    // Reports
    reportsTitle:'Reports', reportsSub:'Date filters · PDF, Excel, JSON export.',
    occupancyReport:'Occupancy report', revenueReport:'Revenue report',
    wcReport:'WC revenue', arrearsReport:'Arrears report',
    expenseReport:'Expense report', cashReport:'Cash report',
    tenantReport:'Tenant report', execSummary:'Executive summary',
    execSumTitle:'Executive summary', boardFigures:'Board-ready figures',
    // Daily Closing
    dailyClosingTitle:'Daily closing', dailyClosingSub:'Every shilling in, every shilling out — reconciled and explained, every day.',
    selectDay:'Select day', today:'Today', yesterday:'Yesterday',
    revenueByStream:'Revenue by stream', rentStream:'Rent', toiletStream:'Toilet revenue', otherStream:'Other revenue',
    entriesCount:'entries', totalCollected:'Total collected today',
    expensesByCategory:'Expenses today', noExpensesToday:'No expenses recorded today.',
    cashReconciliation:'Cash reconciliation', openingCash:'Opening cash', totalIn:'Total in', totalOut:'Total out',
    expectedCash:'Expected cash (théorique)', actualCash2:'Actual cash counted', variance:'Variance (écart)',
    balanced:'Balanced', shortfall:'Shortfall', surplus:'Surplus',
    justificationLabel:'Justification for variance', justificationRequired:'A justification is required because the variance is not zero.',
    justificationPlaceholder:'Explain the difference: e.g. unrecorded expense, change error, pending deposit…',
    notJustified:'⚠ NOT JUSTIFIED', justified:'✓ Justified',
    closeDayBtn:'🔒 Close the day', dayAlreadyClosed:'This day has already been closed.',
    closedBy:'Closed by', closedAt:'at', notClosedYet:'Not closed yet',
    dailySummaryFor:'Daily summary for', tenabilityNote:'This summary forms part of the daily accounting record for tenability and audit purposes.',
    emailSetupTitle:'Automatic email delivery', emailSetupCopy:'Daily summaries can be emailed automatically to the business owner each morning. This requires connecting an email provider (Resend, SendGrid, or similar) — set this up when ready.',
    emailSetupBtn:'Configure email delivery (coming soon)',
    copySummary:'📋 Copy summary text', printSummary:'🖨 Print', summaryCopied:'Summary copied to clipboard.',
    noDataForDay:'No financial activity recorded for this day yet.',
    varianceFlag:'Variance requires justification before closing',
    closingConfirm:'Close this day permanently? This will lock today\'s cash record.',
    closingSuccess:'Day closed and recorded.',
    last7days:'Last 7 days', closingHistory:'Closing history',
    // Payment Reminders
    remindersTitle:'Payment reminders', remindersSub:'Tenants due soon or overdue — one tap to send a WhatsApp reminder.',
    dueSoon:'Due soon', daysUntilDue:'days left', dueToday:'Due today', daysOverdue:'days overdue',
    sendWhatsapp:'📲 WhatsApp', sendSms:'💬 SMS', noPhone:'No phone on file',
    reminderWindow:'Reminder window', reminderWindowDesc:'Show tenants due within',
    days:'days', noReminders:'No payments due soon. Everyone is current.',
    reminderMsgIntro:'Hello', reminderMsgBody:'this is a reminder that your rent for',
    reminderMsgSpace:'space', reminderMsgAmount:'is due on', reminderMsgBalance:'Outstanding balance',
    reminderMsgClosing:'Thank you for your prompt payment.', reminderMsgSignature:'— Centre Commercial Madina',
    markReminded:'Mark as reminded', remindedOn:'Reminded on', alreadyReminded:'Already reminded today',
    overdueSection:'Overdue', dueSoonSection:'Due soon',
    // Board Report
    boardReportTitle:'Board report', boardReportSub:'A two-minute read: revenue, expenses, cash discipline, and collection performance over the period.',
    periodThisMonth:'This month', periodLastMonth:'Last month', periodThisQuarter:'This quarter', periodLastQuarter:'Last quarter', periodCustom:'Custom range',
    periodLabel:'Period', from:'From', to:'To', generateReport:'Generate',
    daysInPeriod:'Days in period', daysClosed:'Days closed', daysMissed:'Days not closed', closingRate:'Closing rate',
    totalRevenuePeriod:'Total revenue', totalExpensesPeriod:'Total expenses', netResultPeriod:'Net result',
    avgDailyRevenue:'Average daily revenue', avgDailyVariance:'Average daily variance', totalVarianceAbs:'Total absolute variance',
    cashDiscipline:'Cash discipline', perfectDays:'Perfect days (zero variance)', justifiedDays:'Justified variance days', unjustifiedDays:'Unjustified variance days',
    revenueBreakdown:'Revenue breakdown', rentShare:'Rent', toiletShare:'Toilet revenue', otherShare:'Other revenue',
    expenseBreakdown:'Expense breakdown by category',
    collectionPerformance:'Rent collection performance', billedThisPeriod:'Rent billed', collectedThisPeriod:'Rent collected', collectionRate:'Collection rate',
    arrearsAtEnd:'Outstanding arrears at period end',
    topExpenseCategories:'Top expense categories', noExpensesPeriod:'No expenses recorded in this period.',
    dailyTrend:'Daily revenue trend', noClosingsPeriod:'No daily closings recorded in this period yet.',
    boardSummaryLine1:'Over this period, the business collected', boardSummaryLine2:'against', boardSummaryLine3:'in expenses, for a net result of',
    boardSummaryClosing:'Cash registers were closed on', boardSummaryClosingOf:'out of', boardSummaryDays:'days',
    exportBoardPdf:'🖨 Print / PDF', exportBoardJson:'Export JSON',
    spaces:'Spaces', occupancy:'Occupancy',
    // Alerts
    alertsTitle:'Operational alerts', alertsSub:'Contracts, rents, maintenance — everything needing action.',
    noAlerts:'✅ No alerts. Everything is up to date.',
    expiringContracts:'Contracts expiring within 60 days',
    overdueRentsTitle:'Overdue rents', openMaintTitle:'Open maintenance',
    vacantSpacesTitle:'Vacant spaces', toRentOut:'Spaces to rent out',
    requestedRent:'Requested rent',
    // Maintenance
    maintenanceTitle:'Maintenance', maintenanceSub:'Requests, contractors, costs, tracking.',
    openRequests:'Open requests', highPriority:'High priority',
    urgent:'Urgent', maintenanceCost:'Maintenance cost', trackedSpend:'Tracked spend',
    contractors:'Contractors', vendors:'Vendors',
    requester:'Requester', description:'Description', contractor:'Contractor',
    cost:'Cost', priority:'Priority', closeDate:'Close date',
    // Users
    usersTitle:'Users & roles', usersSub:'Access management, roles, activity log.',
    users:'Users', profiles:'Profiles', yourRole:'Your role', activeSession:'Active session',
    activityLog:'Activity log', journal:'Journal',
    email:'Email', fullName:'Full name', role:'Role',
    activityLogs:'Activity log',
    // Data
    dataTitle:'Data & backup', dataSub:'JSON import/export and backup management.',
    tablesLoaded:'Modules loaded', localCache:'Local cache',
    records:'Records', totalRows:'Total rows', dataSource:'Data source',
    backupJson:'💾 Backup JSON', restoreJson:'📂 Restore JSON',
    validateFile:'✅ Validate import file',
    loadedTables:'Loaded modules', table:'Module', rows:'Records', category:'Category',
    // Settings
    settingsTitle:'Application settings',
    langLabel:'Language / Langue', themeLabel:'Theme',
    lightTheme:'Light', darkTheme:'Dark',
    // Receipt
    receiptTitle:'PAYMENT RECEIPT', receivedFrom:'Received from',
    paymentSource:'Payment source', paymentRef:'Reference',
    amountReceived:'AMOUNT RECEIVED',
    cashierSig:'Cashier signature', companySeal:'Company stamp',
    officialDoc:'This receipt is an official document of',
    keepRecord:'Keep it for your records.',
    selectPayment:'Select a payment to preview the receipt.',
    // Forms
    invalidAmount:'Invalid amount.', paymentError:'Payment error',
    paymentConfirmed:'Payment confirmed', spaceLabel:'Space',
    balanceDue:'Balance due', amountPaid:'Amount paid (GNF)', paymentMode:'Payment mode',
    confirmPayment:'✅ Confirm payment',
    noGenerate:'No rows to generate for', invalidMonth:'Invalid format — use YYYY-MM.',
    rowsGenerated:'rent rows generated for',
    closeConfirm:'Close month? Unpaid rows will be marked Closed and an archive created.',
    closeSuccess:'Month closed.',
    rowsUpdated:'rows updated.',
    monthClosed:'Month closed (demo).',
    // Import/export
    connectFirst:'Application not ready. Contact your administrator.',
    fileTooLarge:'File too large (max 10 MB).',
    invalidJson:'Invalid JSON file.',
    unsupportedFormat:'Unrecognised format.',
    restoreConfirm:'Restore will overwrite data in',
    tablesWord:'tables. Continue?',
    restoreSuccess:'Backup restored successfully.',
    restoreError:'Restore error on',
    importComplete:'Import complete:',
    importError:'Import error on',
    exportSuccess:'Backup downloaded.',
    noDataExport:'No data to export.',
    validationTitle:'Import file validation',
    notArray:': not an array — will be skipped',
    unknownTable:'UNKNOWN',
    moneyWarn:' · money field warnings',
    // Demo notices
    savedDemo:'Saved (demo).',
    addedDemo:'Added (demo).',
    paymentDemo:'Payment recorded (demo)',
    dupDemo:'Duplicate created (demo).',
    generateDemo:'rows generated (demo).',
    closeDemo:'Month closed (demo).',
    restoredDemo:'Restored (demo).',
    // General notices
    accessDenied:'Access denied',
    recordUpdated:'Record updated.',
    recordAdded:'Record added.',
    configureFirst:'Application not ready. Contact your administrator.',
    duplicateCreated:'Duplicate created',
    backupSuccess:'Backup downloaded.'
  },
  fr:{
    // System
    app:'CENTRE COMMERCIAL MADINA', edition:'NOVATIS GLOBAL SARLU',
    save:'Enregistrer', login:'Connexion', logout:'Déconnexion', refresh:'Actualiser',
    add:'Ajouter', edit:'Modifier', cancel:'Annuler', confirm:'Confirmer', close:'Fermer',
    exportJson:'Exporter JSON', importJson:'Importer JSON', print:'Imprimer', pdf:'PDF',
    duplicate:'Duplicata',
    loading:'Chargement…', empty:'Aucune donnée.', demo:'MODE DÉMO', production:'EN DIRECT',
    quickActions:'Actions rapides',
    noProfile:'Profil introuvable. Contactez votre administrateur.',
    swUpdate:'Nouvelle version disponible — actualisez.',
    contractExpiry:'contrats expirant dans 60 jours',
    overdueRent:'espaces avec loyer en retard',
    maintenanceOpen:'demandes de maintenance ouvertes',
    // Dashboard
    execCenter:'Centre de pilotage',
    collectRent:'💳 Encaisser loyer', wcRevenue:'🚻 Recettes WC', report:'📊 Rapport',
    totalRevenue:'Recettes totales', rentWcOther:'Loyers + WC + autres',
    occupancyRate:'Taux d\'occupation',
    arrears:'Arriérés', unpaidBalances:'Soldes impayés',
    netResult:'Résultat net', revMinusExp:'Recettes − dépenses',
    rentCollected:'Loyers perçus', thisMonth:'Ce mois',
    wcTotal:'Recettes WC', toilets:'Toilettes',
    otherRevenue:'Autres revenus', misc:'Publicité & divers',
    expenses:'Dépenses', opCosts:'Charges opérationnelles',
    manageSpaces:'🏪 Espaces', tenantProfiles:'👥 Locataires',
    contracts:'📄 Contrats', maintenance:'🔧 Maintenance',
    revenueTrend:'Tendance des recettes', last6:'6 dernières périodes',
    overdueRents:'Loyers en retard', tenantCount:'locataires',
    recentPayments:'Derniers paiements', confirmed:'Confirmés',
    monthlyPerf:'Performance mensuelle',
    rentDue:'Loyers attendus', rentPaid:'Loyers perçus',
    additionalRev:'Autres revenus', totalRevLabel:'Total recettes',
    profitLoss:'Résultat net',
    // Spaces
    spacesTitle:'Gestion des espaces', spacesSub:'Boutiques, containers, kiosques, tables, toilettes.',
    totalSpaces:'Total espaces', portfolio:'Portefeuille',
    occupied:'Occupés', active:'Actifs',
    vacant:'Vacants', available:'Disponibles',
    maintenanceIssues:'Maintenance', trackRepairs:'À surveiller',
    typeBreakdown:'Répartition par type',
    spaceCode:'Code', type:'Type', zone:'Zone', area:'Surface', tenant:'Locataire',
    monthlyRent:'Loyer/mois', status:'Statut', condition:'État', actions:'Actions',
    // Tenants
    tenantsTitle:'Gestion des locataires', tenantsSub:'Profils, risque, historique, communications.',
    tenantProf:'Locataires', registered:'Enregistrés',
    highRisk:'Risque élevé', watchList:'Sous surveillance',
    activeContracts:'Contrats actifs', inProgress:'En cours',
    commsLogged:'Communications', logged:'Échanges',
    name:'Nom', business:'Commerce', phone:'Téléphone', activity:'Activité',
    idDoc:'CNI / Pièce ID', risk:'Risque', totalPaid:'Total payé',
    contactBtn:'📞 Contact',
    // Contracts
    contractsTitle:'Contrats de location', contractsSub:'Baux, dates de début/fin, renouvellements.',
    activeContr:'Contrats actifs', inForce:'En vigueur',
    expiringSoon:'Expire bientôt', within60:'Dans 60 jours',
    expired:'Expirés', toRenew:'À renouveler',
    totalDeposits:'Cautions totales', guarantees:'Garanties',
    contractNo:'N° Contrat', space:'Espace', start:'Début', end:'Fin',
    rent:'Loyer', deposit:'Caution', renewal:'Renouvellement', daysLeft:'Jours restants',
    expiringWarn:'contrat(s) expirant dans 60 jours',
    expiredWarn:'contrat(s) expirés — à renouveler d\'urgence',
    // Rent
    rentTitle:'Collecte des loyers', rentSub:'Échéancier, paiements partiels, pénalités, clôture mensuelle.',
    rentScheduled:'Loyers attendus', totalDue:'Total dû',
    collected:'Perçus', payments:'Paiements',
    penalties:'Pénalités', lateFees:'Retards',
    outstanding:'Soldes restants',
    generateMonth:'⚡ Générer le mois', closeMonth:'🔒 Clôturer le mois',
    overdueAlert:'locataire(s) avec solde impayé — Total',
    month:'Mois', dueDate:'Échéance', paid:'Payé', penalty:'Pénalité',
    balance:'Solde', progress:'Progression', payBtn:'💳 Payer',
    arrearsQueue:'File des arriérés',
    // Receipts
    receiptsTitle:'Gestion des reçus', receiptsSub:'Prévisualisation, impression, duplicata, recherche.',
    date:'Date', receiptNo:'N° Reçu', payer:'Locataire',
    amount:'Montant', mode:'Mode', preview:'👁 Voir',
    // Toilets
    toiletsTitle:'Recettes des toilettes', toiletsSub:'Collecte journalière des recettes WC.',
    todayRevenue:"Aujourd'hui", todaySessions:'Sessions du jour',
    monthTotal:'Ce mois', totalEntries:'Total enregistrements', history:'Historique',
    addToilet:'➕ Saisir recette du jour', collector:'Collecteur', sessions:'Sessions',
    // Finance
    financeTitle:'Finances', financeSub:'Caisse, dépenses, dépôts bancaires, rapprochement.',
    rentRevenue:'Recettes loyers', additionalRevenue:'Autres revenus', incToilets:'Dont toilettes',
    cashRegister:'Caisse physique', actualCash:'Cash réel',
    bankBalance:'Solde bancaire', movementBal:'Mouvements',
    bankDeposits:'Dépôts bancaires', preparedPosted:'Préparés/versés',
    reconcGaps:'Écarts caisse', cashVariance:'Variance',
    expensesTitle:'Dépenses', cashClose:'Clôture caisse',
    bankDepositsTitle:'Dépôts bancaires',
    // Reports
    reportsTitle:'Rapports', reportsSub:'Filtres par date · PDF, Excel, JSON.',
    occupancyReport:'Rapport d\'occupation', revenueReport:'Recettes loyers',
    wcReport:'Recettes WC', arrearsReport:'Arriérés',
    expenseReport:'Dépenses', cashReport:'Rapport caisse',
    tenantReport:'Locataires', execSummary:'Résumé exécutif',
    execSumTitle:'Résumé exécutif', boardFigures:'Chiffres pour la direction',
    // Clôture Journalière
    dailyClosingTitle:'Clôture journalière', dailyClosingSub:'Chaque franc qui entre, chaque franc qui sort — justifié et vérifié, chaque jour.',
    selectDay:'Choisir le jour', today:'Aujourd\'hui', yesterday:'Hier',
    revenueByStream:'Recettes par activité', rentStream:'Loyers', toiletStream:'Recettes WC', otherStream:'Autres revenus',
    entriesCount:'entrées', totalCollected:'Total encaissé aujourd\'hui',
    expensesByCategory:'Dépenses du jour', noExpensesToday:'Aucune dépense enregistrée aujourd\'hui.',
    cashReconciliation:'Rapprochement de caisse', openingCash:'Solde d\'ouverture', totalIn:'Total entrées', totalOut:'Total sorties',
    expectedCash:'Solde théorique attendu', actualCash2:'Cash compté réellement', variance:'Écart constaté',
    balanced:'Équilibré', shortfall:'Manque', surplus:'Excédent',
    justificationLabel:'Justification de l\'écart', justificationRequired:'Une justification est obligatoire car l\'écart n\'est pas nul.',
    justificationPlaceholder:'Expliquez la différence : ex. dépense non enregistrée, erreur de monnaie, dépôt en attente…',
    notJustified:'⚠ NON JUSTIFIÉ', justified:'✓ Justifié',
    closeDayBtn:'🔒 Clôturer la journée', dayAlreadyClosed:'Cette journée a déjà été clôturée.',
    closedBy:'Clôturé par', closedAt:'à', notClosedYet:'Pas encore clôturé',
    dailySummaryFor:'Résumé journalier du', tenabilityNote:'Ce résumé fait partie du registre comptable journalier à des fins de traçabilité et d\'audit.',
    emailSetupTitle:'Envoi automatique par email', emailSetupCopy:'Les résumés journaliers peuvent être envoyés automatiquement au propriétaire chaque matin. Cela nécessite la connexion d\'un service email (Resend, SendGrid, ou similaire) — à configurer quand vous serez prêt.',
    emailSetupBtn:'Configurer l\'envoi par email (à venir)',
    copySummary:'📋 Copier le résumé', printSummary:'🖨 Imprimer', summaryCopied:'Résumé copié dans le presse-papiers.',
    noDataForDay:'Aucune activité financière enregistrée pour ce jour.',
    varianceFlag:'L\'écart doit être justifié avant la clôture',
    closingConfirm:'Clôturer définitivement cette journée ? Cela verrouillera le registre de caisse du jour.',
    closingSuccess:'Journée clôturée et enregistrée.',
    last7days:'7 derniers jours', closingHistory:'Historique des clôtures',
    // Rappels de paiement
    remindersTitle:'Rappels de paiement', remindersSub:'Locataires à échéance proche ou en retard — un clic pour envoyer un rappel WhatsApp.',
    dueSoon:'Échéance proche', daysUntilDue:'jours restants', dueToday:'Échéance aujourd\'hui', daysOverdue:'jours de retard',
    sendWhatsapp:'📲 WhatsApp', sendSms:'💬 SMS', noPhone:'Aucun téléphone enregistré',
    reminderWindow:'Fenêtre de rappel', reminderWindowDesc:'Afficher les locataires à échéance dans',
    days:'jours', noReminders:'Aucun paiement à échéance proche. Tout est à jour.',
    reminderMsgIntro:'Bonjour', reminderMsgBody:'ceci est un rappel que votre loyer pour',
    reminderMsgSpace:'espace', reminderMsgAmount:'est dû le', reminderMsgBalance:'Solde restant',
    reminderMsgClosing:'Merci pour votre paiement rapide.', reminderMsgSignature:'— Centre Commercial Madina',
    markReminded:'Marquer comme rappelé', remindedOn:'Rappelé le', alreadyReminded:'Déjà rappelé aujourd\'hui',
    overdueSection:'En retard', dueSoonSection:'Échéance proche',
    // Rapport de Direction
    boardReportTitle:'Rapport de direction', boardReportSub:'Une lecture de deux minutes : recettes, dépenses, discipline de caisse et performance de recouvrement sur la période.',
    periodThisMonth:'Ce mois', periodLastMonth:'Mois dernier', periodThisQuarter:'Ce trimestre', periodLastQuarter:'Trimestre dernier', periodCustom:'Période personnalisée',
    periodLabel:'Période', from:'Du', to:'Au', generateReport:'Générer',
    daysInPeriod:'Jours dans la période', daysClosed:'Jours clôturés', daysMissed:'Jours non clôturés', closingRate:'Taux de clôture',
    totalRevenuePeriod:'Recettes totales', totalExpensesPeriod:'Dépenses totales', netResultPeriod:'Résultat net',
    avgDailyRevenue:'Recette moyenne par jour', avgDailyVariance:'Écart moyen par jour', totalVarianceAbs:'Écart absolu total',
    cashDiscipline:'Discipline de caisse', perfectDays:'Jours parfaits (écart nul)', justifiedDays:'Jours avec écart justifié', unjustifiedDays:'Jours avec écart non justifié',
    revenueBreakdown:'Répartition des recettes', rentShare:'Loyers', toiletShare:'Recettes WC', otherShare:'Autres revenus',
    expenseBreakdown:'Répartition des dépenses par catégorie',
    collectionPerformance:'Performance de recouvrement des loyers', billedThisPeriod:'Loyers facturés', collectedThisPeriod:'Loyers perçus', collectionRate:'Taux de recouvrement',
    arrearsAtEnd:'Arriérés en fin de période',
    topExpenseCategories:'Principales catégories de dépenses', noExpensesPeriod:'Aucune dépense enregistrée sur cette période.',
    dailyTrend:'Tendance des recettes journalières', noClosingsPeriod:'Aucune clôture journalière enregistrée sur cette période.',
    boardSummaryLine1:'Sur cette période, l\'entreprise a encaissé', boardSummaryLine2:'contre', boardSummaryLine3:'de dépenses, pour un résultat net de',
    boardSummaryClosing:'Les caisses ont été clôturées sur', boardSummaryClosingOf:'jours sur', boardSummaryDays:'',
    exportBoardPdf:'🖨 Imprimer / PDF', exportBoardJson:'Exporter JSON',
    spaces:'Espaces', occupancy:'Occupation',
    // Alerts
    alertsTitle:'Alertes opérationnelles', alertsSub:'Contrats, loyers, maintenance — tout ce qui nécessite une action.',
    noAlerts:'✅ Aucune alerte en cours. Tout est à jour.',
    expiringContracts:'Contrats expirant dans 60 jours',
    overdueRentsTitle:'Loyers impayés', openMaintTitle:'Maintenance en cours',
    vacantSpacesTitle:'Espaces vacants', toRentOut:'À louer',
    requestedRent:'Loyer demandé',
    // Maintenance
    maintenanceTitle:'Maintenance', maintenanceSub:'Demandes, prestataires, coûts, suivi.',
    openRequests:'Ouvertes', highPriority:'Priorité haute',
    urgent:'Urgentes', maintenanceCost:'Coût maintenance', trackedSpend:'Dépenses suivi',
    contractors:'Prestataires', vendors:'Intervenants',
    requester:'Demandeur', description:'Description', contractor:'Prestataire',
    cost:'Coût', priority:'Priorité', closeDate:'Date clôture',
    // Users
    usersTitle:'Utilisateurs & rôles', usersSub:'Gestion des accès, rôles, journal d\'activité.',
    users:'Utilisateurs', profiles:'Profils', yourRole:'Votre rôle', activeSession:'Session active',
    activityLog:'Journal d\'activité', journal:'Journal',
    email:'Email', fullName:'Nom complet', role:'Rôle',
    activityLogs:'Journal d\'activité',
    // Data
    dataTitle:'Données & sauvegarde', dataSub:'Import/export JSON et gestion des sauvegardes.',
    tablesLoaded:'Modules chargés', localCache:'Cache local',
    records:'Enregistrements', totalRows:'Total lignes', dataSource:'Source des données',
    backupJson:'💾 Sauvegarde JSON', restoreJson:'📂 Restaurer JSON',
    validateFile:'✅ Valider fichier import',
    loadedTables:'Tables chargées', table:'Table', rows:'Lignes', category:'Catégorie',
    // Settings
    settingsTitle:'Paramètres de l\'application',
    langLabel:'Langue / Language', themeLabel:'Thème',
    lightTheme:'Clair', darkTheme:'Sombre',
    // Receipt
    receiptTitle:'REÇU DE PAIEMENT', receivedFrom:'Reçu de',
    paymentSource:'Objet', paymentRef:'Référence',
    amountReceived:'MONTANT REÇU',
    cashierSig:'Signature du caissier', companySeal:'Cachet de la société',
    officialDoc:'Ce reçu est un document officiel de',
    keepRecord:'Conservez-le pour votre comptabilité.',
    selectPayment:'Sélectionnez un paiement pour afficher le reçu.',
    // Forms
    invalidAmount:'Montant invalide.', paymentError:'Erreur paiement',
    paymentConfirmed:'Paiement confirmé', spaceLabel:'Espace',
    balanceDue:'Solde dû', amountPaid:'Montant versé (GNF)', paymentMode:'Mode de paiement',
    confirmPayment:'✅ Confirmer paiement',
    noGenerate:'Aucune ligne à générer pour', invalidMonth:'Format invalide — utilisez YYYY-MM.',
    rowsGenerated:'lignes de loyer générées pour',
    closeConfirm:'Clôturer ce mois ? Les lignes impayées seront marquées Closed et une archive créée.',
    closeSuccess:'Mois clôturé.',
    rowsUpdated:'lignes mises à jour.',
    monthClosed:'Mois clôturé (démo).',
    // Import/export
    connectFirst:'Application non prête. Contactez votre administrateur.',
    fileTooLarge:'Fichier trop volumineux (max 10 Mo).',
    invalidJson:'Fichier JSON invalide.',
    unsupportedFormat:'Format non reconnu.',
    restoreConfirm:'La restauration va écraser les données de',
    tablesWord:'tables. Continuer ?',
    restoreSuccess:'Sauvegarde restaurée avec succès.',
    restoreError:'Erreur restauration sur',
    importComplete:'Import terminé :',
    importError:'Erreur import sur',
    exportSuccess:'Sauvegarde téléchargée.',
    noDataExport:'Aucune donnée à exporter.',
    validationTitle:'Validation du fichier d\'import',
    notArray:' : pas un tableau — ignoré',
    unknownTable:'INCONNU',
    moneyWarn:' · avertissement champs monétaires',
    // Demo notices
    savedDemo:'Modifié (démo).', addedDemo:'Ajouté (démo).',
    paymentDemo:'Paiement enregistré (démo)',
    dupDemo:'Duplicata créé (démo).', generateDemo:'lignes générées (démo).',
    closeDemo:'Mois clôturé (démo).', restoredDemo:'Restauré (démo).',
    // General notices
    accessDenied:'Accès refusé',
    recordUpdated:'Enregistrement modifié.',
    recordAdded:'Enregistrement ajouté.',
    configureFirst:'Application non prête. Contactez votre administrateur.',
    duplicateCreated:'Duplicata créé',
    backupSuccess:'Sauvegarde téléchargée.'
  }
};

// ── Role permission tables ────────────────────────────────────────────────────
const READ_GRANTS = {
  'Super Admin':  ['*'],
  Directeur:      ['dashboard','spaces','tenants','contracts','rent','receipts','toilets','finance','dailyclosing','boardreport','reports','maintenance','alerts','data'],
  Comptable:      ['dashboard','rent','receipts','toilets','finance','dailyclosing','boardreport','reports','data'],
  'Agent terrain':['dashboard','spaces','tenants','rent','receipts','toilets','maintenance','alerts'],
  Caissier:       ['dashboard','rent','receipts','toilets'],
  // Viewer = PDG/executive read-only: full visibility across all business and financial
  // modules including activity logs. Zero write access — see WRITE_GRANTS below.
  Viewer:         ['dashboard','spaces','tenants','contracts','rent','receipts','toilets','finance','dailyclosing','boardreport','reports','maintenance','alerts','users']
};
const WRITE_GRANTS = {
  'Super Admin':  ['*'],
  Directeur:      ['spaces','tenants','contracts','rent','receipts','toilets','maintenance','communications','dailyclosing'],
  Comptable:      ['rent','receipts','toilets','finance','depenses','caisse','revenus','depots','dailyclosing'],
  'Agent terrain':['spaces','tenants','maintenance','communications','rent','receipts','toilets'],
  Caissier:       ['rent','receipts','toilets'],
  Viewer:         []   // PDG role: strictly read-only, can view and validate, can never edit, add, delete, or pay anything
};

// ── Global state ──────────────────────────────────────────────────────────────
let client   = null;
let session  = null;
let current  = 'dashboard';
let rows     = {};
let filters  = {};
let userRole = 'Viewer';
let _filterTimer = null;
let _isLoading   = false;

// ── Utilities ─────────────────────────────────────────────────────────────────
function el(id){ return document.getElementById(id); }
function prefs(){ try{ return JSON.parse(localStorage.getItem(PREF_KEY)||'{}'); }catch{ return {}; } }
function setPrefs(p){ localStorage.setItem(PREF_KEY, JSON.stringify({...prefs(),...p})); }
function lang(){ return prefs().lang || 'fr'; }           // Default: French; boss (Viewer role) can toggle to EN with one click
function t(k){ return I18N[lang()][k] || I18N.fr[k] || k; }
function tr(f){ const p=LABELS[f]; return p?p[lang()==='fr'?1:0]:f; }
function n(v){ return Number(v||0)||0; }
function money(v){ return n(v).toLocaleString('fr-FR')+' GNF'; }
function esc(v){ return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function norm(v){ return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function tableMeta(id){ return TABLES.find(t=>t[0]===id); }
function isDemo(){ return localStorage.getItem(DEMO_KEY)==='1'; }
function nowDate(){ return new Date().toISOString().slice(0,10); }
function monthKey(d=new Date()){ return d.toISOString().slice(0,7); }
function isOccupied(r){ return ['occupe','occupee','occupé','occupée','occupied'].includes(norm(r.statut)); }
function isVacant(r){ return ['vacant','libre','disponible','available'].includes(norm(r.statut)); }
function daysUntil(date){ if(!date) return 9999; return Math.ceil((new Date(date)-new Date())/86400000); }
function can(module, action='read'){
  const rList=READ_GRANTS[userRole]||[], wList=WRITE_GRANTS[userRole]||[];
  const ok=rList.includes('*')||rList.includes(module);
  if(!ok) return false;
  if(action!=='read') return wList.includes('*')||wList.includes(module);
  return true;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showNotice(msg, type='info'){
  document.querySelectorAll('.npms-notice').forEach(e=>e.remove());
  const d=document.createElement('div'); d.className='npms-notice';
  const bg={info:'#1d5fa7',success:'#1f6b4a',warn:'#a15c07',error:'#b42318'}[type]||'#1d5fa7';
  d.style.cssText=`position:fixed;top:18px;right:18px;z-index:9999;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;max-width:380px;cursor:pointer;background:${bg};color:#fff;box-shadow:0 4px 24px rgba(0,0,0,.3);`;
  d.textContent=msg; d.onclick=()=>d.remove();
  document.body.appendChild(d);
  setTimeout(()=>d.remove(),5000);
}

// ── Loading state ─────────────────────────────────────────────────────────────
function setLoading(on){
  _isLoading=on;
  document.querySelectorAll('button.primary').forEach(b=>{b.disabled=on;b.style.opacity=on?'0.55':'';});
  if(on) setSync(t('loading'));
}

// ── Demo data — real Madina space types ───────────────────────────────────────
function demoRows(){
  const inv=[
    {id:'sp-01',codeespace:'B-01',typeespace:'Boutique',zone:'Bloc A',surface:15,loyermensuel:1800000,nomlocataireofficiel:'Fatoumata Camara',nomoccupantreel:'Fatoumata Camara',nomcommercial:'Fato Fashion',activite:'Vente vêtements',telephone:'+224 621 11 11 11',statut:'Occupied',etatmaintenance:'Good',risque:'Low'},
    {id:'sp-02',codeespace:'B-02',typeespace:'Boutique',zone:'Bloc A',surface:18,loyermensuel:2000000,nomlocataireofficiel:'Mamadou Diallo',nomoccupantreel:'Mamadou Diallo',nomcommercial:'Diallo Électronique',activite:'Électronique',telephone:'+224 622 22 22 22',statut:'Occupied',etatmaintenance:'Good',risque:'Medium'},
    {id:'sp-03',codeespace:'C-01',typeespace:'Container',zone:'Bloc B',surface:4,loyermensuel:600000,nomlocataireofficiel:'Aissatou Bah',nomoccupantreel:'Aissatou Bah',nomcommercial:'AB Cosmétiques',activite:'Cosmétiques',telephone:'+224 623 33 33 33',statut:'Occupied',etatmaintenance:'Average',risque:'Low'},
    {id:'sp-04',codeespace:'C-02',typeespace:'Container',zone:'Bloc B',surface:4,loyermensuel:600000,nomlocataireofficiel:'',statut:'Vacant',etatmaintenance:'Good',risque:'Low'},
    {id:'sp-05',codeespace:'T-01',typeespace:'Table',zone:'Bloc C',surface:1,loyermensuel:180000,nomlocataireofficiel:'Mariama Baldé',nomoccupantreel:'Mariama Baldé',nomcommercial:'Mariama Légumes',activite:'Maraîchage',telephone:'+224 624 44 44 44',statut:'Occupied',etatmaintenance:'Good',risque:'Low'},
    {id:'sp-06',codeespace:'K-01',typeespace:'Kiosque',zone:'Entrée',surface:3,loyermensuel:400000,nomlocataireofficiel:'Ibrahima Kouyaté',nomoccupantreel:'Ibrahima Kouyaté',nomcommercial:'IBK Mobile',activite:'Téléphonie mobile',telephone:'+224 625 55 55 55',statut:'Occupied',etatmaintenance:'Good',risque:'Low'},
    {id:'sp-07',codeespace:'WC-A',typeespace:'Toilettes',zone:'Bloc A',surface:12,loyermensuel:0,nomlocataireofficiel:'Gestion',statut:'Active',etatmaintenance:'Needs repair',risque:'High'},
    {id:'sp-08',codeespace:'B-03',typeespace:'Boutique',zone:'Bloc A',surface:20,loyermensuel:2200000,nomlocataireofficiel:'Alpha Sow',nomoccupantreel:'Alpha Sow',nomcommercial:'Sow Informatique',activite:'Informatique',telephone:'+224 626 66 66 66',statut:'Occupied',etatmaintenance:'Good',risque:'Low'}
  ];
  const now=monthKey();
  const prevMonth=monthKey(new Date(new Date().setMonth(new Date().getMonth()-1)));
  return {
    inventaire:inv,
    locataires:inv.filter(x=>x.nomlocataireofficiel&&x.nomlocataireofficiel!=='Gestion').map(x=>({
      id:'loc-'+x.id,nom:x.nomlocataireofficiel,occupantreel:x.nomoccupantreel,
      commerce:x.nomcommercial,telephone:x.telephone,activite:x.activite,
      documentid:'CNI en attente',risque:x.risque,statut:'Active'
    })),
    contrats:inv.filter(isOccupied).map((x,i)=>({
      id:'ctr-'+i,numero:'CTR-2026-'+String(i+1).padStart(3,'0'),
      boutiquecode:x.codeespace,locataire:x.nomlocataireofficiel,
      datedebut:'2025-01-01',
      datefin: i===1?'2026-07-31':i===3?'2026-08-15':'2026-12-31',
      montantloyer:x.loyermensuel,caution:x.loyermensuel*2,
      statut:'Active',renouvellement:'Manuel'
    })),
    loyers:[
      {id:'loy-1',boutiquecode:'B-01',locataire:'Fatoumata Camara',mois:now,duedate:now.slice(0,7)+'-05',montant:1800000,paye:1800000,penalite:0,solde:0,statut:'Paid'},
      {id:'loy-2',boutiquecode:'B-02',locataire:'Mamadou Diallo',mois:now,duedate:now.slice(0,7)+'-05',montant:2000000,paye:1000000,penalite:100000,solde:1100000,statut:'Partial'},
      {id:'loy-3',boutiquecode:'C-01',locataire:'Aissatou Bah',mois:now,duedate:now.slice(0,7)+'-05',montant:600000,paye:0,penalite:30000,solde:630000,statut:'Overdue'},
      {id:'loy-4',boutiquecode:'T-01',locataire:'Mariama Baldé',mois:now,duedate:now.slice(0,7)+'-05',montant:180000,paye:180000,penalite:0,solde:0,statut:'Paid'},
      {id:'loy-5',boutiquecode:'K-01',locataire:'Ibrahima Kouyaté',mois:now,duedate:now.slice(0,7)+'-05',montant:400000,paye:400000,penalite:0,solde:0,statut:'Paid'},
      {id:'loy-6',boutiquecode:'B-03',locataire:'Alpha Sow',mois:now,duedate:now.slice(0,7)+'-05',montant:2200000,paye:2200000,penalite:0,solde:0,statut:'Paid'},
      {id:'loy-7',boutiquecode:'B-02',locataire:'Mamadou Diallo',mois:prevMonth,duedate:prevMonth.slice(0,7)+'-05',montant:2000000,paye:2000000,penalite:0,solde:0,statut:'Paid'}
    ],
    paiements:[
      {id:'pay-1',date:nowDate(),reference:'OM-'+Date.now(),numero_recu:'REC-2026-00001',payeur:'Fatoumata Camara',source:'Loyer',espace:'B-01',montant:1800000,mode:'Orange Money',statut:'Confirmed',duplicata:'No'},
      {id:'pay-2',date:nowDate(),reference:'CSH-'+Date.now(),numero_recu:'REC-2026-00002',payeur:'Mamadou Diallo',source:'Loyer (acompte)',espace:'B-02',montant:1000000,mode:'Espèces',statut:'Confirmed',duplicata:'No'},
      {id:'pay-3',date:nowDate(),reference:'OM-'+(Date.now()+1),numero_recu:'REC-2026-00003',payeur:'Mariama Baldé',source:'Loyer',espace:'T-01',montant:180000,mode:'Orange Money',statut:'Confirmed',duplicata:'No'},
      {id:'pay-4',date:nowDate(),reference:'OM-'+(Date.now()+2),numero_recu:'REC-2026-00004',payeur:'Ibrahima Kouyaté',source:'Loyer',espace:'K-01',montant:400000,mode:'Orange Money',statut:'Confirmed',duplicata:'No'},
      {id:'pay-5',date:nowDate(),reference:'VIR-'+(Date.now()+3),numero_recu:'REC-2026-00005',payeur:'Alpha Sow',source:'Loyer',espace:'B-03',montant:2200000,mode:'Virement bancaire',statut:'Confirmed',duplicata:'No'}
    ],
    recettes_wc:[
      {id:'wc-1',date:nowDate(),collecteur:'Agent 1',montant:45000,sessions:12,statut:'Confirmed'},
      {id:'wc-2',date:new Date(Date.now()-86400000).toISOString().slice(0,10),collecteur:'Agent 1',montant:52000,sessions:14,statut:'Confirmed'}
    ],
    revenus:[
      {id:'rev-1',date:nowDate(),source:'Publicité murale',description:'Panneau entrée Bloc A',montant:500000,mode:'Espèces',statut:'Confirmed'}
    ],
    depenses:[
      {id:'dep-1',date:nowDate(),categorie:'Électricité',description:'Facture EDG',fournisseur:'EDG Guinée',montant:850000,modepaiement:'Virement',statut:'Paid'},
      {id:'dep-2',date:nowDate(),categorie:'Nettoyage',description:'Équipe de nettoyage',fournisseur:'Clean Pro Conakry',montant:350000,modepaiement:'Espèces',statut:'Paid'},
      {id:'dep-3',date:nowDate(),categorie:'Sécurité',description:'Gardiens × 4',fournisseur:'SecuriGuard GN',montant:600000,modepaiement:'Espèces',statut:'Paid'}
    ],
    caisse:[
      {id:'csh-1',date:nowDate(),caissier:'Comptable',soldeouverture:0,entrees:6580000,sorties:1800000,soldetheorique:4780000,cashreel:4775000,ecart:-5000,justification:'Erreur de monnaie rendue au client B-02 le matin, corrigée le soir.',statut:'Open'},
      {id:'csh-2',date:new Date(Date.now()-86400000).toISOString().slice(0,10),caissier:'Comptable',soldeouverture:200000,entrees:5200000,sorties:1500000,soldetheorique:3900000,cashreel:3900000,ecart:0,justification:'',statut:'Closed',closed_by:'comptable@madina.novatis.gn',closed_at:new Date(Date.now()-72000000).toISOString()}
    ],
    mouvements_caisse:[],depots:[],mouvements_banque:[],
    maintenance:[
      {id:'mnt-1',date:nowDate(),espace:'WC-A',demandeur:'Gestion',description:'Réparation canalisation d\'eau',contractor:'Plombier Sory',cost:350000,statut:'Open',priority:'High'},
      {id:'mnt-2',date:nowDate(),espace:'B-02',demandeur:'Mamadou Diallo',description:'Climatiseur en panne',contractor:'Froid Service',cost:200000,statut:'In progress',priority:'Medium'}
    ],
    communications:[
      {id:'com-1',date:nowDate(),locataire:'Mamadou Diallo',canal:'Téléphone',sujet:'Rappel solde loyer',details:'Promesse de payer avant le 20 du mois.',utilisateur:'Agent terrain'}
    ],
    profiles:[
      {id:'prf-1',email:'admin@madina.novatis.gn',fullname:'Administrateur NPMS',role:'Super Admin',statut:'Active'},
      {id:'prf-boss',email:'PDG@madina.novatis.gn',fullname:'PDG — Propriétaire',role:'Viewer',statut:'Active'},
      {id:'prf-2',email:'directeur@madina.novatis.gn',fullname:'Directeur Madina',role:'Directeur',statut:'Active'},
      {id:'prf-3',email:'comptable@madina.novatis.gn',fullname:'Comptable Madina',role:'Comptable',statut:'Active'},
      {id:'prf-4',email:'agent@madina.novatis.gn',fullname:'Agent Terrain',role:'Agent terrain',statut:'Active'},
      {id:'prf-5',email:'caissier@madina.novatis.gn',fullname:'Caissier Madina',role:'Caissier',statut:'Active'}
    ],
    activity_logs:[
      {id:'log-1',date:new Date().toISOString(),action:'login',module:'auth',utilisateur:'admin@madina.novatis.gn',details:'Session opened'},
      {id:'log-2',date:new Date().toISOString(),action:'payment',module:'loyers',utilisateur:'admin@madina.novatis.gn',details:'REC-2026-00001 — Fatoumata Camara'}
    ],
    archives:[]
  };
}

// ── Database init — config.js sets window.__NPMS_CONFIG__ at build time ───────
function initClient(){
  const cfg=window.__NPMS_CONFIG__||{};
  if(cfg.url&&cfg.anon&&window.supabase){
    client=window.supabase.createClient(cfg.url,cfg.anon);
    // Session expiry listener — fires SIGNED_OUT when refresh token expires.
    // Resets to Viewer and notifies the user without requiring a page reload.
    client.auth.onAuthStateChange((event,s)=>{
      if(event==='SIGNED_OUT'){
        session=null; userRole='Viewer';
        showNotice(
          lang()==='fr'
            ? 'Votre session a expiré. Veuillez vous reconnecter.'
            : 'Your session has expired. Please sign in again.',
          'warn'
        );
        render();
      } else if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED'){
        session=s;
      }
    });
  }
}
function setSync(txt){
  const syncEl=el('syncState'); if(!syncEl) return;
  syncEl.textContent=isDemo()?t('demo'):(txt||t('production'));
}

async function refreshSession(){
  if(!client) return;
  const {data}=await client.auth.getSession();
  session=data.session;
  el('loginBtn').classList.toggle('hidden',!!session);
  el('logoutBtn').classList.toggle('hidden',!session);
}

// ── loadAll ───────────────────────────────────────────────────────────────────
async function loadAll(){
  if(isDemo()){
    rows=demoRows(); userRole='Super Admin';
    setSync(t('demo')); render(); return;
  }
  if(!client){
    // Config not injected (local dev without config.js, or build not run).
    // Show a non-technical message and stay on the login screen.
    rows={}; userRole='Viewer';
    setSync(lang()==='fr'?'Non configuré':'Not configured');
    showNotice(
      lang()==='fr'
        ? 'Application non configurée. Contactez votre administrateur.'
        : 'Application not configured. Contact your administrator.',
      'warn'
    );
    render(); return;
  }
  setLoading(true);
  try {
    await refreshSession();
    for(const [id] of TABLES){
      const {data,error}=await client.from(id).select('*').limit(3000);
      rows[id]=error?[]:(data||[]);
    }
    const email=session?.user?.email;
    const profile=(rows.profiles||[]).find(p=>p.email===email);
    if(email&&!profile){ userRole='Viewer'; showNotice(t('noProfile'),'error'); }
    else userRole=profile?.role||'Viewer';
    setSync(t('production'));
  } finally { setLoading(false); render(); }
}
async function refreshTable(tid){
  if(!client) return;
  const {data,error}=await client.from(tid).select('*').limit(3000);
  if(!error) rows[tid]=data||[];
}

// ── Navigation ────────────────────────────────────────────────────────────────
function renderNav(){
  const grouped={};
  MODULES.filter(m=>can(m.id)).forEach(m=>(grouped[m.group]||=[]).push(m));
  el('nav').innerHTML=Object.entries(grouped).map(([group,mods])=>
    `<div class="navGroup">${esc(group)}</div>`+mods.map(m=>{
      const alerts=navBadge(m.id);
      return `<button class="navBtn ${current===m.id?'active':''}" onclick="navigate('${m.id}')">${esc(m[lang()])}${alerts?` <span class="navBadge">${alerts}</span>`:''}</button>`;
    }).join('')
  ).join('');
}
function navBadge(id){
  if(id==='alerts') return operationalAlerts().total||'';
  if(id==='rent') return (rows.loyers||[]).filter(r=>n(r.solde)>0).length||'';
  if(id==='maintenance') return (rows.maintenance||[]).filter(r=>/open|progress/i.test(r.statut||'')).length||'';
  return 0;
}
function navigate(id){
  if(!can(id)){ showNotice('Accès refusé','error'); return; }
  current=id;
  el('dashboard').classList.toggle('active',id==='dashboard');
  el('tablePage').classList.toggle('active',id!=='dashboard');
  render();
}
function setHeader(title,sub){ el('pageTitle').textContent=title; el('pageSub').textContent=sub||'NPMS Enterprise'; }

// ── Render dispatch ───────────────────────────────────────────────────────────
function render(){
  document.documentElement.dataset.theme=prefs().theme||'light';
  renderNav();
  const module=MODULES.find(m=>m.id===current);
  setHeader(module?module[lang()]:'NPMS',`${t('production')} · ${userRole}`);
  const langBtn=el('langToggleBtn');
  if(langBtn) langBtn.textContent=lang()==='fr'?'EN':'FR';
  const R={
    dashboard:renderDashboard, spaces:renderSpaces, tenants:renderTenants,
    contracts:renderContracts, rent:renderRent, receipts:renderReceipts,
    toilets:renderToilets, finance:renderFinance, dailyclosing:renderDailyClosing, boardreport:renderBoardReport, reports:renderReports,
    maintenance:renderMaintenance, alerts:renderAlerts,
    users:renderUsers, data:renderData, settings:renderSettings
  };
  (R[current]||renderDashboard)();
}

// Setup panel removed — configuration is injected at build time via config.js.
// No URL, key, or infrastructure settings are accessible from the user interface.

// ── UI helpers ────────────────────────────────────────────────────────────────
function stat(label,value,note,kind=''){
  return `<div class="card stat ${kind}"><span>${esc(label)}</span><strong>${esc(String(value))}</strong><small>${esc(note||'')}</small></div>`;
}
function miniBar(label,value,max){
  return `<div class="barRow"><span>${esc(label)}</span><div><b style="width:${Math.min(100,max?value/max*100:0)}%"></b></div><em>${esc(String(value))}</em></div>`;
}
function statusBadge(v){
  const s=String(v||'');
  let cls='neutral';
  if(/paid|confirmed|active|occupied|good|conforme|payé|actif|occupé|manuel|low|faible/i.test(s)) cls='ok';
  if(/partial|pending|open|prepare|medium|partiel|attente|moyen|progress|variance/i.test(s)) cls='warn';
  if(/arrears|overdue|late|impayé|retard|high|eleve|expired|resilie|closed|annulé|needs repair/i.test(s)) cls='err';
  return `<span class="badge ${cls}">${esc(s||'—')}</span>`;
}
function table(headers,records,rowFn,empty=t('empty')){
  return `<div class="tableWrap"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${records.length?records.map(rowFn).join(''):`<tr><td colspan="${headers.length}" class="emptyCell">${esc(empty)}</td></tr>`}</tbody></table></div>`;
}
function actions(tbl,id,extra=''){
  const sId=esc(id),sTbl=esc(tbl);
  return `<div class="rowActions">${extra}${can(current,'write')?`<button onclick="openForm('${sTbl}','${sId}')">${t('edit')}</button>`:''}</div>`;
}
function alertBanner(msg,kind='warn'){
  return `<div class="alertBanner ${kind}"><span>⚠</span><p>${esc(msg)}</p></div>`;
}

// ── Metrics ───────────────────────────────────────────────────────────────────
function metrics(){
  const inv=rows.inventaire||[],loyers=rows.loyers||[],payments=rows.paiements||[],
        revenus=rows.revenus||[],depenses=rows.depenses||[],contracts=rows.contrats||[],
        wc=rows.recettes_wc||[];
  const occupied=inv.filter(isOccupied).length;
  const rentDue=loyers.reduce((a,r)=>a+n(r.montant)+n(r.penalite),0);
  const rentPaid=loyers.reduce((a,r)=>a+n(r.paye),0)||payments.filter(p=>/loyer/i.test(p.source)).reduce((a,p)=>a+n(p.montant),0);
  const arrears=loyers.reduce((a,r)=>a+n(r.solde),0);
  const other=revenus.reduce((a,r)=>a+n(r.montant),0);
  const wcTotal=wc.reduce((a,r)=>a+n(r.montant),0);
  const out=depenses.reduce((a,r)=>a+n(r.montant),0);
  const totalIn=rentPaid+other+wcTotal;
  return {inv,loyers,payments,revenus,depenses,contracts,wc,occupied,rentDue,rentPaid,
          arrears,other,wcTotal,out,net:totalIn-out,totalIn,
          occupancy:inv.length?Math.round(occupied/inv.length*100):0};
}

// ── Operational alerts ────────────────────────────────────────────────────────
function operationalAlerts(){
  const expiringContracts=(rows.contrats||[]).filter(c=>c.statut==='Active'&&daysUntil(c.datefin)<=60&&daysUntil(c.datefin)>=0);
  const overdueRent=(rows.loyers||[]).filter(r=>n(r.solde)>0);
  const openMaintenance=(rows.maintenance||[]).filter(r=>/open|progress/i.test(r.statut||''));
  const vacantSpaces=(rows.inventaire||[]).filter(isVacant);
  const unjustifiedVariance=(rows.caisse||[]).filter(c=>{
    const v=n(c.ecart);
    return Math.abs(v)>0.5 && (!c.justification||!c.justification.trim());
  });
  return {expiringContracts,overdueRent,openMaintenance,vacantSpaces,unjustifiedVariance,
          total:expiringContracts.length+overdueRent.length+openMaintenance.length+unjustifiedVariance.length};
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function renderDashboard(){
  const m=metrics();
  const alerts=operationalAlerts();
  const monthly=groupMoney([...m.payments.map(p=>({date:p.date,amount:n(p.montant)})),...m.revenus.map(r=>({date:r.date,amount:n(r.montant)})),...m.wc.map(r=>({date:r.date,amount:n(r.montant)}))], 'amount');
  const maxMonth=Math.max(1,...monthly.map(x=>x.value));
  const recent=m.payments.slice(-5).reverse();
  const arrears=m.loyers.filter(r=>n(r.solde)>0).slice(0,5);

  const alertsHtml=[
    alerts.unjustifiedVariance.length?alertBanner(`${alerts.unjustifiedVariance.length} ${lang()==='fr'?'jour(s) avec écart de caisse non justifié':'day(s) with unjustified cash variance'} — ${lang()==='fr'?'voir Clôture Journalière':'see Daily Closing'}`,'red'):'',
    alerts.expiringContracts.length?alertBanner(`${alerts.expiringContracts.length} ${t('contractExpiry')} : ${alerts.expiringContracts.map(c=>c.boutiquecode).join(', ')}`):'',
    alerts.overdueRent.length?alertBanner(`${alerts.overdueRent.length} ${t('overdueRent')}`):'',
    alerts.openMaintenance.length?alertBanner(`${alerts.openMaintenance.length} ${t('maintenanceOpen')}`):'',
  ].filter(Boolean).join('');

  el('dashboard').innerHTML=`
    <div class="madinaHero">
      <div class="madinaHeroLeft">
        <div class="madinaLogo">M</div>
        <div>
          <h2>Centre Commercial Madina</h2>
          <p>NOVATIS GLOBAL SARLU · Conakry · ${new Date().toLocaleDateString(lang()==='fr'?'fr-FR':'en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
      </div>
      <div class="heroActions">
        <button onclick="navigate('rent')" class="primary">${t('collectRent')}</button>
        <button onclick="navigate('toilets')">${t('wcRevenue')}</button>
        <button onclick="navigate('reports')">${t('report')}</button>
      </div>
    </div>
    ${alertsHtml?`<div class="alertsBlock">${alertsHtml}</div>`:''}
    <div class="grid stats">
      ${stat(t('totalRevenue'),money(m.totalIn),t('rentWcOther'),'accent')}
      ${stat(t('occupancyRate'),m.occupancy+'%',`${m.occupied}/${m.inv.length} ${t('spaces')}`)}
      ${stat(t('arrears'),money(m.arrears),t('unpaidBalances'),m.arrears?'risk':'')}
      ${stat(t('netResult'),money(m.net),t('revMinusExp'))}
    </div>
    <div class="grid stats">
      ${stat(t('rentCollected'),money(m.rentPaid),t('thisMonth'))}
      ${stat(t('wcTotal'),money(m.wcTotal),t('toilets'))}
      ${stat(t('otherRevenue'),money(m.other),t('misc'))}
      ${stat(t('expenses'),money(m.out),t('opCosts'))}
    </div>
    <div class="quickGrid">
      <button onclick="navigate('dailyclosing')" class="primary">${lang()==='fr'?'🔒 Clôture du jour':'🔒 Today\'s closing'}</button>
      <button onclick="navigate('boardreport')" class="primary">${lang()==='fr'?'📊 Rapport de direction':'📊 Board report'}</button>
      <button onclick="navigate('spaces')">${t('manageSpaces')}</button>
      <button onclick="navigate('tenants')">${t('tenantProfiles')}</button>
      <button onclick="navigate('contracts')">${t('contracts')}</button>
      <button onclick="navigate('maintenance')">${t('maintenance')}</button>
    </div>
    <div class="grid two">
      <div class="card section"><div class="sectionHead"><h3>${t('revenueTrend')}</h3><p>${t('last6')}</p></div><div class="bars">${monthly.map(x=>miniBar(x.label,money(x.value),maxMonth)).join('')||emptyState(t('empty'))}</div></div>
      <div class="card section"><div class="sectionHead"><h3>${t('overdueRents')}</h3><p>${arrears.length} ${t('tenantCount')}</p></div>${table([t('space'),t('tenant'),t('rentDue'),t('paid'),t('balance'),t('status')],arrears,r=>`<tr><td><b>${esc(r.boutiquecode)}</b></td><td>${esc(r.locataire)}</td><td>${money(r.montant)}</td><td>${money(r.paye)}</td><td class="bold-red">${money(r.solde)}</td><td>${statusBadge(r.statut)}</td></tr>`)}</div>
    </div>
    <div class="grid two">
      <div class="card section"><div class="sectionHead"><h3>${t('recentPayments')}</h3><p>${t('confirmed')}</p></div>${table([t('date'),t('receiptNo'),t('payer'),t('amount'),t('mode')],recent,r=>`<tr><td>${esc(r.date)}</td><td><b>${esc(r.numero_recu||r.reference)}</b></td><td>${esc(r.payeur)}</td><td>${money(r.montant)}</td><td>${esc(r.mode)}</td></tr>`)}</div>
      <div class="card section"><div class="sectionHead"><h3>${t('monthlyPerf')}</h3></div><div class="summaryRows">${summaryRow(t('rentDue'),money(m.rentDue))}${summaryRow(t('rentPaid'),money(m.rentPaid))}${summaryRow(t('wcTotal'),money(m.wcTotal))}${summaryRow(t('additionalRev'),money(m.other))}${summaryRow(t('expenses'),money(m.out))}${summaryRow(t('profitLoss'),money(m.net),true)}</div></div>
    </div>`;
}

// ── SPACES ────────────────────────────────────────────────────────────────────
function renderSpaces(){
  const data=filtered('inventaire');
  const types=countBy(data,'typeespace');
  const max=Math.max(1,...Object.values(types));
  el('tablePage').innerHTML=pageShell(t('spacesTitle'),t('spacesSub'),'inventaire',`
    <div class="grid stats">${stat(t('totalSpaces'),data.length,t('portfolio'))}${stat(t('occupied'),data.filter(isOccupied).length,t('active'))}${stat(t('vacant'),data.filter(isVacant).length,t('available'))}${stat(t('maintenanceIssues'),data.filter(x=>/repair|needs/i.test(x.etatmaintenance||'')).length,t('trackRepairs'))}</div>
    <div class="card section"><div class="sectionHead"><h3>${t('typeBreakdown')}</h3></div><div class="bars">${Object.entries(types).map(([k,v])=>miniBar(k,v,max)).join('')}</div></div>
    ${table([t('spaceCode'),t('type'),t('zone'),t('area'),t('tenant'),t('monthlyRent'),t('status'),t('condition'),t('actions')],data,
      r=>`<tr><td><b>${esc(r.codeespace)}</b></td><td>${statusBadge(r.typeespace)}</td><td>${esc(r.zone)}</td><td>${esc(r.surface)}m²</td><td>${esc(r.nomlocataireofficiel||'—')}</td><td>${money(r.loyermensuel)}</td><td>${statusBadge(r.statut)}</td><td>${statusBadge(r.etatmaintenance)}</td><td>${actions('inventaire',r.id)}</td></tr>`)}
  `);
}

// ── TENANTS ───────────────────────────────────────────────────────────────────
function renderTenants(){
  const tenants=filtered('locataires');
  const payments=rows.paiements||[];
  el('tablePage').innerHTML=pageShell(t('tenantsTitle'),t('tenantsSub'),'locataires',`
    <div class="grid stats">${stat(t('tenantProf'),tenants.length,t('registered'))}${stat(t('highRisk'),tenants.filter(x=>/high|eleve/i.test(x.risque||'')).length,t('watchList'))}${stat(t('activeContracts'),(rows.contrats||[]).filter(x=>/active/i.test(x.statut)).length,t('inProgress'))}${stat(t('commsLogged'),(rows.communications||[]).length,t('logged'))}</div>
    ${table([t('name'),t('business'),t('phone'),t('activity'),t('idDoc'),t('risk'),t('totalPaid'),t('actions')],tenants,r=>{
      const paid=payments.filter(p=>p.payeur===r.nom).reduce((a,p)=>a+n(p.montant),0);
      return `<tr><td><b>${esc(r.nom)}</b></td><td>${esc(r.commerce)}</td><td>${esc(r.telephone)}</td><td>${esc(r.activite)}</td><td>${esc(r.documentid)}</td><td>${statusBadge(r.risque)}</td><td>${money(paid)}</td><td>${actions('locataires',r.id,`<button onclick="openCommunication('${esc(r.nom)}')">${t('contactBtn')}</button>`)}</td></tr>`;
    })}
  `);
}

// ── CONTRACTS ─────────────────────────────────────────────────────────────────
function renderContracts(){
  const data=filtered('contrats');
  const expiring=data.filter(c=>c.statut==='Active'&&daysUntil(c.datefin)<=60&&daysUntil(c.datefin)>=0);
  const expired=data.filter(c=>daysUntil(c.datefin)<0&&c.statut==='Active');
  el('tablePage').innerHTML=pageShell(t('contractsTitle'),t('contractsSub'),'contrats',`
    <div class="grid stats">${stat(t('activeContr'),data.filter(c=>c.statut==='Active').length,t('inForce'))}${stat(t('expiringSoon'),expiring.length,t('within60'),'risk')}${stat(t('expired'),expired.length,t('toRenew'),expired.length?'risk':'')}${stat(t('totalDeposits'),money(data.reduce((a,c)=>a+n(c.caution),0)),t('guarantees'))}</div>
    ${expiring.length?alertBanner(`${expiring.length} ${t('expiringWarn')} : ${expiring.map(c=>c.boutiquecode+' ('+c.datefin+')').join(' · ')}`):''}
    ${expired.length?alertBanner(`${expired.length} ${t('expiredWarn')} : ${expired.map(c=>c.boutiquecode).join(', ')}`):''}
    ${table([t('contractNo'),t('space'),t('tenant'),t('start'),t('end'),t('rent'),t('deposit'),t('status'),t('daysLeft'),t('actions')],data,
      r=>{const d=daysUntil(r.datefin);
      return `<tr><td><b>${esc(r.numero)}</b></td><td>${esc(r.boutiquecode)}</td><td>${esc(r.locataire)}</td><td>${esc(r.datedebut)}</td><td>${esc(r.datefin)}</td><td>${money(r.montantloyer)}</td><td>${money(r.caution)}</td><td>${statusBadge(r.statut)}</td><td class="${d<=30?'bold-red':d<=60?'bold-amber':''}">${d<0?t('expired'):d+' '+(lang()==='fr'?'j':'d')}</td><td>${actions('contrats',r.id)}</td></tr>`;
      })}
  `);
}

// ── RENT COLLECTION ───────────────────────────────────────────────────────────
function renderRent(){
  const rent=filtered('loyers');
  const arrears=rent.filter(r=>n(r.solde)>0);
  const mois=monthKey();
  el('tablePage').innerHTML=pageShell(t('rentTitle'),t('rentSub'),'loyers',`
    <div class="grid stats">${stat(t('rentScheduled'),money(sum(rent,'montant')),t('totalDue'))}${stat(t('collected'),money(sum(rent,'paye')),t('payments'))}${stat(t('penalties'),money(sum(rent,'penalite')),t('lateFees'))}${stat(t('outstanding'),money(sum(rent,'solde')),t('arrears'),'risk')}</div>
    <div class="tools blockTools">
      <button onclick="generateMonthlyRent()" class="primary">${t('generateMonth')} ${mois}</button>
      <button onclick="monthlyClosing()">${t('closeMonth')}</button>
    </div>
    ${arrears.length?alertBanner(`${arrears.length} ${t('overdueAlert')} : ${money(sum(arrears,'solde'))}`):''}
    ${table([t('space'),t('tenant'),t('month'),t('dueDate'),t('rent'),t('paid'),t('penalty'),t('balance'),t('progress'),t('status'),t('actions')],rent,
      r=>`<tr><td><b>${esc(r.boutiquecode)}</b></td><td>${esc(r.locataire)}</td><td>${esc(r.mois)}</td><td>${esc(r.duedate)}</td><td>${money(r.montant)}</td><td>${money(r.paye)}</td><td>${money(r.penalite)}</td><td class="${n(r.solde)?'bold-red':''}">${money(r.solde)}</td><td>${paymentTimeline(r)}</td><td>${statusBadge(r.statut)}</td><td>${actions('loyers',r.id,`<button onclick="recordPayment('${esc(r.id)}')" class="primary">${t('payBtn')}</button>`)}</td></tr>`)}

    <div class="card section" style="margin-top:16px">
      <div class="sectionHead">
        <h3>${t('remindersTitle')}</h3>
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted)">
          <span>${t('reminderWindowDesc')}</span>
          <select id="reminderWindowSelect" style="width:80px;min-height:30px;padding:4px 6px" onchange="setReminderWindow(this.value)">
            ${[3,5,7,10,14].map(d=>`<option value="${d}" ${reminderWindowDays()===d?'selected':''}>${d}</option>`).join('')}
          </select>
          <span>${t('days')}</span>
        </div>
      </div>
      <p style="padding:0 16px 6px;font-size:12px;color:var(--muted)">${t('remindersSub')}</p>
      ${renderReminderList()}
    </div>
  `);
}

// ── Payment Reminders ─────────────────────────────────────────────────────────
const REMINDER_WINDOW_KEY='npms_reminder_window';
const REMINDED_LOG_KEY='npms_reminded_log';
function reminderWindowDays(){ return Number(localStorage.getItem(REMINDER_WINDOW_KEY))||5; }
function setReminderWindow(v){ localStorage.setItem(REMINDER_WINDOW_KEY,v); render(); }
function remindedLog(){ try{ return JSON.parse(localStorage.getItem(REMINDED_LOG_KEY)||'{}'); }catch{ return {}; } }
function markReminded(rentId){
  const log=remindedLog(); log[rentId]=nowDate();
  localStorage.setItem(REMINDED_LOG_KEY,JSON.stringify(log));
}
function wasRemindedToday(rentId){ return remindedLog()[rentId]===nowDate(); }

// Builds the tenant-facing reminder message in the active UI language.
function reminderMessage(rent){
  const due=daysUntil(rent.duedate);
  const overdue=due<0;
  return [
    `${t('reminderMsgIntro')} ${rent.locataire},`,
    '',
    `${t('reminderMsgBody')} ${rent.boutiquecode} (${rent.mois}) ${t('reminderMsgAmount')} ${esc(rent.duedate)}.`,
    `${t('reminderMsgBalance')}: ${money(rent.solde||rent.montant)}`,
    overdue ? `${Math.abs(due)} ${t('daysOverdue')}.` : (due===0?`${t('dueToday')}.`:`${due} ${t('daysUntilDue')}.`),
    '',
    t('reminderMsgClosing'),
    t('reminderMsgSignature')
  ].join('\n');
}

// Normalises a phone number for wa.me deep links: digits only, no leading +/00.
// Guinean numbers are typically written as +224 6XX XX XX XX in our data.
function normalizePhoneForWhatsapp(phone){
  if(!phone) return null;
  let digits=String(phone).replace(/[^\d]/g,'');
  if(digits.startsWith('00')) digits=digits.slice(2);
  return digits.length>=8?digits:null;
}

function renderReminderList(){
  const windowDays=reminderWindowDays();
  const tenantsByName={};
  (rows.locataires||[]).forEach(t=>{ tenantsByName[t.nom]=t; });

  const candidates=(rows.loyers||[])
    .filter(r=>n(r.solde)>0)
    .map(r=>({...r,_days:daysUntil(r.duedate),_tenant:tenantsByName[r.locataire]}))
    .filter(r=>r._days<=windowDays)
    .sort((a,b)=>a._days-b._days);

  if(!candidates.length) return `<div class="emptyState">${t('noReminders')}</div>`;

  const overdue=candidates.filter(r=>r._days<0);
  const dueSoon=candidates.filter(r=>r._days>=0);

  const renderGroup=(title,list)=>!list.length?'':`
    <div class="reminderGroupLabel">${title} (${list.length})</div>
    ${table([t('tenant'),t('space'),t('dueDate'),t('balance'),t('status'),t('actions')],list,r=>{
      const phone=normalizePhoneForWhatsapp(r._tenant?.telephone);
      const dayLabel=r._days<0?`<span class="bold-red">${Math.abs(r._days)} ${t('daysOverdue')}</span>`
        :r._days===0?`<span class="bold-amber">${t('dueToday')}</span>`
        :`<span>${r._days} ${t('daysUntilDue')}</span>`;
      const waLink=phone?`https://wa.me/${phone}?text=${encodeURIComponent(reminderMessage(r))}`:null;
      const remindedToday=wasRemindedToday(r.id);
      return `<tr>
        <td><b>${esc(r.locataire)}</b></td>
        <td>${esc(r.boutiquecode)}</td>
        <td>${esc(r.duedate)}</td>
        <td class="bold-red">${money(r.solde)}</td>
        <td>${dayLabel}</td>
        <td><div class="rowActions">
          ${waLink
            ? `<a href="${waLink}" target="_blank" rel="noopener" class="btnLink" onclick="markReminded('${esc(r.id)}')">${t('sendWhatsapp')}</a>`
            : `<span class="dcWarnText" style="margin:0">${t('noPhone')}</span>`}
          ${remindedToday?`<span class="badge ok" style="margin-left:4px">${t('alreadyReminded')}</span>`:''}
        </div></td>
      </tr>`;
    })}`;

  return renderGroup(t('overdueSection'),overdue)+renderGroup(t('dueSoonSection'),dueSoon);
}

// ── RECEIPTS ──────────────────────────────────────────────────────────────────
function renderReceipts(){
  const payments=filtered('paiements');
  const selected=payments[0];
  el('tablePage').innerHTML=pageShell(t('receiptsTitle'),t('receiptsSub'),'paiements',`
    <div class="grid two receiptGrid">
      <div>${table([t('date'),t('receiptNo'),t('tenant'),t('space'),t('paymentSource'),t('amount'),t('mode'),t('actions')],payments,
        r=>`<tr><td>${esc(r.date)}</td><td><b>${esc(r.numero_recu||r.reference)}</b></td><td>${esc(r.payeur)}</td><td>${esc(r.espace)}</td><td>${esc(r.source)}</td><td>${money(r.montant)}</td><td>${esc(r.mode)}</td><td>${actions('paiements',r.id,`<button onclick="previewReceipt('${esc(r.id)}')">${t('preview')}</button><button onclick="duplicateReceipt('${esc(r.id)}')">${t('duplicate')}</button>`)}</td></tr>`)}</div>
      <div class="card section" id="receiptPreview">${receiptHtml(selected)}</div>
    </div>
  `);
}

// ── TOILET REVENUE ────────────────────────────────────────────────────────────
function renderToilets(){
  const data=filtered('recettes_wc');
  const today=data.filter(r=>r.date===nowDate());
  const totalToday=sum(today,'montant');
  const totalMonth=sum(data.filter(r=>r.date&&r.date.startsWith(monthKey())),'montant');
  el('tablePage').innerHTML=pageShell(t('toiletsTitle'),t('toiletsSub'),'recettes_wc',`
    <div class="grid stats">
      ${stat(t('todayRevenue'),money(totalToday),t('todaySessions'))}
      ${stat(t('monthTotal'),money(totalMonth),t('thisMonth'))}
      ${stat(t('todaySessions'),sum(today,'sessions'),t('toiletsTitle'))}
      ${stat(t('totalEntries'),data.length,t('history'))}
    </div>
    <div class="tools blockTools">
      <button class="primary" onclick="openForm('recettes_wc')">${t('addToilet')}</button>
    </div>
    ${table([t('date'),t('collector'),t('sessions'),t('amount'),t('status'),t('actions')],data.slice().reverse().slice(0,30),
      r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.collecteur)}</td><td>${esc(r.sessions)}</td><td><b>${money(r.montant)}</b></td><td>${statusBadge(r.statut)}</td><td>${actions('recettes_wc',r.id)}</td></tr>`)}
  `);
}

// ── FINANCE ───────────────────────────────────────────────────────────────────
function renderFinance(){
  const m=metrics();
  const cash=rows.caisse||[],deposits=rows.depots||[],bank=rows.mouvements_banque||[];
  const actualCash=cash.reduce((a,r)=>a+n(r.cashreel),0);
  const bankBal=bank.reduce((a,r)=>a+n(r.entree)-n(r.sortie),0);
  el('tablePage').innerHTML=`
    <div class="pageToolbar"><div><h3>${t('financeTitle')}</h3><p>${t('financeSub')}</p></div><div class="tools"><button onclick="exportCurrentCsv('finance')">📥 ${t('exportJson').replace('JSON','CSV')}</button><button onclick="window.print()">🖨 ${t('pdf')}</button></div></div>
    <div class="grid stats">${stat(t('rentRevenue'),money(m.rentPaid),t('confirmed'))}${stat(t('wcTotal'),money(m.wcTotal),t('toilets'))}${stat(t('additionalRevenue'),money(m.other),t('otherRevenue'))}${stat(t('expenses'),money(m.out),t('opCosts'))}</div>
    <div class="grid stats">${stat(t('cashRegister'),money(actualCash),t('actualCash'))}${stat(t('bankBalance'),money(bankBal),t('movementBal'))}${stat(t('bankDeposits'),money(sum(deposits,'montant')),t('preparedPosted'))}${stat(t('reconcGaps'),money(sum(cash,'ecart')),t('cashVariance'),sum(cash,'ecart')?'risk':'')}</div>
    <div class="grid two"><div class="card section"><div class="sectionHead"><h3>${t('expensesTitle')}</h3>${can(current,'write')?`<button onclick="openForm('depenses')">${t('add')}</button>`:''}</div>${genericTable('depenses')}</div><div class="card section"><div class="sectionHead"><h3>${t('cashClose')}</h3>${can(current,'write')?`<button onclick="openForm('caisse')">${t('add')}</button>`:''}</div>${genericTable('caisse')}</div></div>
    <div class="card section"><div class="sectionHead"><h3>${t('bankDepositsTitle')}</h3>${can(current,'write')?`<button onclick="openForm('depots')">${t('add')}</button>`:''}</div>${genericTable('depots')}</div>
  `;
}

// ── DAILY CLOSING (Clôture Journalière) ───────────────────────────────────────
// Computes a single day's full reconciliation: revenue by stream, expenses,
// cash opening/closing, variance, and justification status. Used both for the
// on-screen Daily Closing page and as the basis for any future automated
// email summary — same numbers, same function, no drift between the two.
function dailyClosingData(dateStr){
  const payments=(rows.paiements||[]).filter(p=>p.date===dateStr);
  const rentPayments=payments.filter(p=>/loyer|rent/i.test(p.source||''));
  const wc=(rows.recettes_wc||[]).filter(r=>r.date===dateStr);
  const other=(rows.revenus||[]).filter(r=>r.date===dateStr);
  const expenses=(rows.depenses||[]).filter(r=>r.date===dateStr);
  const cashRow=(rows.caisse||[]).find(r=>r.date===dateStr);

  const rentTotal=sum(rentPayments,'montant');
  const wcTotal=sum(wc,'montant');
  const otherTotal=sum(other,'montant');
  const expTotal=sum(expenses,'montant');
  const totalIn=rentTotal+wcTotal+otherTotal;

  const opening=n(cashRow?.soldeouverture);
  const expected=cashRow?.soldetheorique!=null?n(cashRow.soldetheorique):opening+totalIn-expTotal;
  const actual=cashRow?.cashreel!=null?n(cashRow.cashreel):null;
  const variance=actual!=null?Math.round((actual-expected)*100)/100:null;
  const hasVariance=variance!=null&&Math.abs(variance)>0.5;
  const justification=cashRow?.justification||'';
  const isJustified=!hasVariance||Boolean(justification&&justification.trim().length>0);
  const isClosed=cashRow?.statut==='Closed'||!!cashRow?.closed_at;

  return {date:dateStr,rentPayments,wc,other,expenses,cashRow,
    rentTotal,wcTotal,otherTotal,expTotal,totalIn,
    opening,expected,actual,variance,hasVariance,justification,isJustified,isClosed,
    hasAnyData:payments.length||wc.length||other.length||expenses.length||!!cashRow};
}

function dateRange(fromStr,toStr){
  const out=[]; const cur=new Date(fromStr+'T00:00:00'); const end=new Date(toStr+'T00:00:00');
  while(cur<=end){ out.push(cur.toISOString().slice(0,10)); cur.setDate(cur.getDate()+1); }
  return out;
}

// Aggregates daily closings across a date range into a single board-level summary.
// Every number here is built by summing dailyClosingData() outputs day by day,
// so the monthly/quarterly figures can never disagree with what the Daily Closing
// page shows for any individual day — same source of truth, two views.
function periodClosingRollup(fromStr,toStr){
  const days=dateRange(fromStr,toStr).map(d=>dailyClosingData(d));
  const withData=days.filter(d=>d.hasAnyData);
  const closedDays=days.filter(d=>d.isClosed);

  const rentTotal=sum(withData,'rentTotal');
  const wcTotal=sum(withData,'wcTotal');
  const otherTotal=sum(withData,'otherTotal');
  const expTotal=sum(withData,'expTotal');
  const totalIn=rentTotal+wcTotal+otherTotal;
  const net=totalIn-expTotal;

  const variancesWithData=withData.filter(d=>d.variance!=null);
  const totalVarianceAbs=variancesWithData.reduce((a,d)=>a+Math.abs(d.variance),0);
  const avgVariance=variancesWithData.length?totalVarianceAbs/variancesWithData.length:0;
  const perfectDays=variancesWithData.filter(d=>Math.abs(d.variance)<=0.5).length;
  const justifiedDays=variancesWithData.filter(d=>Math.abs(d.variance)>0.5&&d.isJustified).length;
  const unjustifiedDays=variancesWithData.filter(d=>Math.abs(d.variance)>0.5&&!d.isJustified).length;

  // Expense categories rolled up across the period
  const allExpenses=withData.flatMap(d=>d.expenses);
  const expenseByCategory={};
  allExpenses.forEach(e=>{ const cat=e.categorie||'—'; expenseByCategory[cat]=(expenseByCategory[cat]||0)+n(e.montant); });
  const topExpenses=Object.entries(expenseByCategory).sort((a,b)=>b[1]-a[1]);

  // Rent billed vs collected: pull directly from loyers rows whose 'mois' falls in the period months
  const periodMonths=new Set(dateRange(fromStr,toStr).map(d=>d.slice(0,7)));
  const periodRent=(rows.loyers||[]).filter(r=>periodMonths.has(r.mois));
  const billed=sum(periodRent,'montant')+sum(periodRent,'penalite');
  const collected=sum(periodRent,'paye');
  const collectionRate=billed?Math.round(collected/billed*100):0;
  const arrearsEnd=sum(periodRent,'solde');

  return {
    fromStr,toStr,days,withData,closedDays,
    rentTotal,wcTotal,otherTotal,expTotal,totalIn,net,
    avgDailyRevenue:withData.length?totalIn/withData.length:0,
    avgVariance,totalVarianceAbs,perfectDays,justifiedDays,unjustifiedDays,
    topExpenses,billed,collected,collectionRate,arrearsEnd,
    closingRate:days.length?Math.round(closedDays.length/days.length*100):0
  };
}

function presetPeriod(preset){
  const t=new Date();
  if(preset==='thisMonth'){
    const from=new Date(t.getFullYear(),t.getMonth(),1);
    return {from:from.toISOString().slice(0,10),to:nowDate()};
  }
  if(preset==='lastMonth'){
    const from=new Date(t.getFullYear(),t.getMonth()-1,1);
    const to=new Date(t.getFullYear(),t.getMonth(),0);
    return {from:from.toISOString().slice(0,10),to:to.toISOString().slice(0,10)};
  }
  if(preset==='thisQuarter'){
    const q=Math.floor(t.getMonth()/3);
    const from=new Date(t.getFullYear(),q*3,1);
    return {from:from.toISOString().slice(0,10),to:nowDate()};
  }
  if(preset==='lastQuarter'){
    const q=Math.floor(t.getMonth()/3)-1;
    const year=q<0?t.getFullYear()-1:t.getFullYear();
    const qq=q<0?3:q;
    const from=new Date(year,qq*3,1);
    const to=new Date(year,qq*3+3,0);
    return {from:from.toISOString().slice(0,10),to:to.toISOString().slice(0,10)};
  }
  return {from:nowDate(),to:nowDate()};
}

function renderBoardReport(){
  const preset=filters.boardPreset||'thisMonth';
  let from=filters.boardFrom, to=filters.boardTo;
  if(preset!=='custom'||!from||!to){ const p=presetPeriod(preset); from=p.from; to=p.to; }
  const r=periodClosingRollup(from,to);
  const maxDay=Math.max(1,...r.withData.map(d=>d.totalIn));

  el('tablePage').innerHTML=`
    <div class="pageToolbar">
      <div><h3>${t('boardReportTitle')}</h3><p>${t('boardReportSub')}</p></div>
      <div class="tools">
        <button onclick="window.print()">${t('exportBoardPdf')}</button>
        <button onclick="exportBoardReportJson('${from}','${to}')">${t('exportBoardJson')}</button>
      </div>
    </div>

    <div class="card section" style="padding:14px 16px">
      <div class="tab-bar" style="display:flex;gap:6px;flex-wrap:wrap">
        ${[['thisMonth',t('periodThisMonth')],['lastMonth',t('periodLastMonth')],['thisQuarter',t('periodThisQuarter')],['lastQuarter',t('periodLastQuarter')],['custom',t('periodCustom')]]
          .map(([key,label])=>`<button class="${preset===key?'primary':''}" onclick="setBoardPreset('${key}')">${esc(label)}</button>`).join('')}
      </div>
      ${preset==='custom'?`
        <div style="display:flex;gap:10px;align-items:center;margin-top:10px;flex-wrap:wrap">
          <label>${t('from')} <input type="date" id="boardFromInput" value="${esc(from)}"></label>
          <label>${t('to')} <input type="date" id="boardToInput" value="${esc(to)}" max="${nowDate()}"></label>
          <button class="primary" onclick="applyBoardCustomRange()">${t('generateReport')}</button>
        </div>` : `<p style="margin-top:8px;font-size:12px;color:var(--muted)">${formatLongDate(from)} → ${formatLongDate(to)}</p>`}
    </div>

    <div class="boardSummaryBanner">
      <p>${t('boardSummaryLine1')} <strong>${money(r.totalIn)}</strong> ${t('boardSummaryLine2')} <strong>${money(r.expTotal)}</strong> ${t('boardSummaryLine3')} <strong class="${r.net>=0?'pos':'neg'}">${money(r.net)}</strong>.</p>
      <p>${t('boardSummaryClosing')} <strong>${r.closedDays.length}</strong> ${t('boardSummaryClosingOf')} ${r.days.length} ${t('boardSummaryDays')} (${r.closingRate}%).</p>
    </div>

    <div class="grid stats">
      ${stat(t('totalRevenuePeriod'),money(r.totalIn),t('avgDailyRevenue')+': '+money(Math.round(r.avgDailyRevenue)),'accent')}
      ${stat(t('totalExpensesPeriod'),money(r.expTotal),t('opCosts'))}
      ${stat(t('netResultPeriod'),money(r.net),t('revMinusExp'),r.net<0?'risk':'')}
      ${stat(t('closingRate'),r.closingRate+'%',`${r.closedDays.length}/${r.days.length} ${t('daysClosed').toLowerCase()}`)}
    </div>

    <div class="grid two">
      <div class="card section">
        <div class="sectionHead"><h3>${t('revenueBreakdown')}</h3></div>
        <div class="dcStreamGrid">
          <div class="dcStream"><span>${t('rentShare')}</span><strong>${money(r.rentTotal)}</strong><small>${r.totalIn?Math.round(r.rentTotal/r.totalIn*100):0}%</small></div>
          <div class="dcStream"><span>${t('toiletShare')}</span><strong>${money(r.wcTotal)}</strong><small>${r.totalIn?Math.round(r.wcTotal/r.totalIn*100):0}%</small></div>
          <div class="dcStream"><span>${t('otherShare')}</span><strong>${money(r.otherTotal)}</strong><small>${r.totalIn?Math.round(r.otherTotal/r.totalIn*100):0}%</small></div>
        </div>
      </div>
      <div class="card section">
        <div class="sectionHead"><h3>${t('cashDiscipline')}</h3></div>
        <div class="summaryRows">
          ${summaryRow(t('perfectDays'),r.perfectDays)}
          ${summaryRow(t('justifiedDays'),r.justifiedDays)}
          ${summaryRow(t('unjustifiedDays'),r.unjustifiedDays,r.unjustifiedDays>0)}
          ${summaryRow(t('avgDailyVariance'),money(Math.round(r.avgVariance)))}
        </div>
      </div>
    </div>

    <div class="card section">
      <div class="sectionHead"><h3>${t('collectionPerformance')}</h3></div>
      <div class="summaryRows">
        ${summaryRow(t('billedThisPeriod'),money(r.billed))}
        ${summaryRow(t('collectedThisPeriod'),money(r.collected))}
        ${summaryRow(t('collectionRate'),r.collectionRate+'%')}
        ${summaryRow(t('arrearsAtEnd'),money(r.arrearsEnd),true)}
      </div>
    </div>

    <div class="card section">
      <div class="sectionHead"><h3>${t('topExpenseCategories')}</h3></div>
      ${r.topExpenses.length?table([t('category'),t('amount')],r.topExpenses,
        ([cat,amt])=>`<tr><td>${statusBadge(cat)}</td><td>${money(amt)}</td></tr>`):`<div class="emptyState">${t('noExpensesPeriod')}</div>`}
    </div>

    <div class="card section">
      <div class="sectionHead"><h3>${t('dailyTrend')}</h3></div>
      ${r.withData.length?`<div class="bars">${r.withData.map(d=>miniBar(d.date.slice(5),money(d.totalIn),maxDay)).join('')}</div>`:`<div class="emptyState">${t('noClosingsPeriod')}</div>`}
    </div>
  `;
}

function setBoardPreset(key){
  filters.boardPreset=key;
  if(key!=='custom'){ filters.boardFrom=null; filters.boardTo=null; }
  render();
}
function applyBoardCustomRange(){
  const from=el('boardFromInput')?.value, to=el('boardToInput')?.value;
  if(!from||!to||from>to){ showNotice(lang()==='fr'?'Plage de dates invalide.':'Invalid date range.','error'); return; }
  filters.boardFrom=from; filters.boardTo=to; render();
}
function exportBoardReportJson(from,to){
  const r=periodClosingRollup(from,to);
  const blob=new Blob([JSON.stringify({
    version:`NPMS Enterprise v${APP_VERSION}`,property:PROPERTY.name,
    reportType:'Board Report',from,to,generatedAt:new Date().toISOString(),
    totals:{rentTotal:r.rentTotal,wcTotal:r.wcTotal,otherTotal:r.otherTotal,totalIn:r.totalIn,expTotal:r.expTotal,net:r.net},
    cashDiscipline:{perfectDays:r.perfectDays,justifiedDays:r.justifiedDays,unjustifiedDays:r.unjustifiedDays,avgVariance:r.avgVariance},
    collection:{billed:r.billed,collected:r.collected,collectionRate:r.collectionRate,arrearsEnd:r.arrearsEnd},
    topExpenses:r.topExpenses
  },null,2)],{type:'application/json'});
  download(blob,`npms-board-report-${from}-to-${to}.json`);
}

function renderDailyClosing(){
  const selectedDate=filters.dailyclosing||nowDate();
  const d=dailyClosingData(selectedDate);
  const varClass=d.variance==null?'':d.variance===0?'ok':d.variance>0?'warn':'err';
  const varLabel=d.variance==null?'—':d.variance===0?t('balanced'):d.variance>0?t('surplus'):t('shortfall');

  el('tablePage').innerHTML=`
    <div class="pageToolbar">
      <div><h3>${t('dailyClosingTitle')}</h3><p>${t('dailyClosingSub')}</p></div>
      <div class="tools">
        <input type="date" id="closingDate" value="${esc(selectedDate)}" max="${nowDate()}" onchange="setFilter('dailyclosing',this.value)">
        <button onclick="setFilter('dailyclosing','${nowDate()}')">${t('today')}</button>
        <button onclick="window.print()">${t('printSummary')}</button>
        <button onclick="copyDailySummary('${esc(selectedDate)}')">${t('copySummary')}</button>
      </div>
    </div>

    ${!d.hasAnyData?`<div class="card section"><div class="emptyState">${t('noDataForDay')}</div></div>`:''}

    <div class="dcHeaderCard">
      <div>
        <div class="dcDate">${t('dailySummaryFor')} ${formatLongDate(selectedDate)}</div>
        <div class="dcStatus ${d.isClosed?'closed':'open'}">
          ${d.isClosed
            ? `🔒 ${t('closedBy')} ${esc(d.cashRow?.closed_by||'—')} ${t('closedAt')} ${d.cashRow?.closed_at?new Date(d.cashRow.closed_at).toLocaleTimeString(lang()==='fr'?'fr-FR':'en-GB',{hour:'2-digit',minute:'2-digit'}):''}`
            : `🔓 ${t('notClosedYet')}`}
        </div>
      </div>
      <div class="dcTotal">
        <span>${t('totalCollected')}</span>
        <strong>${money(d.totalIn)}</strong>
      </div>
    </div>

    <div class="card section">
      <div class="sectionHead"><h3>${t('revenueByStream')}</h3></div>
      <div class="dcStreamGrid">
        <div class="dcStream"><span>${t('rentStream')}</span><strong>${money(d.rentTotal)}</strong><small>${d.rentPayments.length} ${t('entriesCount')}</small></div>
        <div class="dcStream"><span>${t('toiletStream')}</span><strong>${money(d.wcTotal)}</strong><small>${d.wc.length} ${t('entriesCount')}</small></div>
        <div class="dcStream"><span>${t('otherStream')}</span><strong>${money(d.otherTotal)}</strong><small>${d.other.length} ${t('entriesCount')}</small></div>
      </div>
      ${table([t('date'),t('receiptNo'),t('payer'),t('amount'),t('mode')],d.rentPayments,
        r=>`<tr><td>${esc(r.date)}</td><td><b>${esc(r.numero_recu||r.reference)}</b></td><td>${esc(r.payeur)}</td><td>${money(r.montant)}</td><td>${esc(r.mode)}</td></tr>`)}
    </div>

    <div class="card section">
      <div class="sectionHead"><h3>${t('expensesByCategory')}</h3></div>
      ${d.expenses.length?table([t('category'),t('description'),t('amount')],d.expenses,
        r=>`<tr><td>${statusBadge(r.categorie)}</td><td>${esc(r.description)}</td><td>${money(r.montant)}</td></tr>`):`<div class="emptyState">${t('noExpensesToday')}</div>`}
    </div>

    <div class="card section dcReconcile">
      <div class="sectionHead"><h3>${t('cashReconciliation')}</h3></div>
      <div class="summaryRows">
        ${summaryRow(t('openingCash'),money(d.opening))}
        ${summaryRow(t('totalIn'),money(d.totalIn))}
        ${summaryRow(t('totalOut'),money(d.expTotal))}
        ${summaryRow(t('expectedCash'),money(d.expected))}
        ${summaryRow(t('actualCash2'),d.actual!=null?money(d.actual):'—')}
      </div>
      <div class="dcVarianceBox ${varClass}">
        <span>${t('variance')}</span>
        <strong>${d.variance!=null?money(Math.abs(d.variance)):'—'} ${d.variance!=null?`(${varLabel})`:''}</strong>
      </div>

      ${d.hasVariance?`
        <div class="dcJustify ${d.isJustified?'ok':'err'}">
          <label>${t('justificationLabel')} ${d.isJustified?`<span class="badge ok">${t('justified')}</span>`:`<span class="badge err">${t('notJustified')}</span>`}</label>
          ${!d.isJustified?`<p class="dcWarnText">${t('justificationRequired')}</p>`:''}
          <textarea id="justificationText" rows="2" placeholder="${t('justificationPlaceholder')}" ${can('dailyclosing','write')?'':'disabled'}>${esc(d.justification)}</textarea>
          ${can('dailyclosing','write')&&!d.isClosed?`<button class="primary" onclick="saveJustification('${esc(selectedDate)}')">${t('save')}</button>`:''}
        </div>` : ''}

      ${can('dailyclosing','write')&&!d.isClosed&&d.hasAnyData?`
        <div class="dcCloseRow">
          <button class="primary" ${d.hasVariance&&!d.isJustified?'disabled title="'+esc(t('varianceFlag'))+'"':''} onclick="closeDailyCash('${esc(selectedDate)}')">${t('closeDayBtn')}</button>
          ${d.hasVariance&&!d.isJustified?`<span class="dcWarnText">${t('varianceFlag')}</span>`:''}
        </div>` : d.isClosed?`<div class="dcWarnText" style="color:var(--green)">${t('dayAlreadyClosed')}</div>`:''}
    </div>

    <p class="tenabilityNote">${t('tenabilityNote')}</p>

    <div class="card section">
      <div class="sectionHead"><h3>${t('emailSetupTitle')}</h3></div>
      <p style="padding:0 16px 12px;font-size:13px;color:var(--muted)">${t('emailSetupCopy')}</p>
      <div style="padding:0 16px 16px"><button disabled title="Coming soon">${t('emailSetupBtn')}</button></div>
    </div>

    <div class="card section">
      <div class="sectionHead"><h3>${t('closingHistory')}</h3><p>${t('last7days')}</p></div>
      ${renderClosingHistory()}
    </div>
  `;
  const dateInput=el('closingDate');
  if(dateInput) dateInput.onchange=e=>setFilter('dailyclosing',e.target.value);
}

function renderClosingHistory(){
  const days=[];
  for(let i=0;i<7;i++){
    const dt=new Date(); dt.setDate(dt.getDate()-i);
    const ds=dt.toISOString().slice(0,10);
    days.push(dailyClosingData(ds));
  }
  return table([t('date'),t('totalCollected'),t('variance'),t('status')],days.filter(d=>d.hasAnyData),
    d=>{
      const vClass=d.variance==null?'neutral':d.variance===0?'ok':Math.abs(d.variance)<=0.5?'ok':d.isJustified?'warn':'err';
      const vText=d.variance==null?'—':money(d.variance);
      return `<tr style="cursor:pointer" onclick="setFilter('dailyclosing','${d.date}')">
        <td><b>${esc(d.date)}</b></td><td>${money(d.totalIn)}</td>
        <td><span class="badge ${vClass}">${vText}</span></td>
        <td>${d.isClosed?`<span class="badge ok">🔒 ${lang()==='fr'?'Clôturé':'Closed'}</span>`:`<span class="badge neutral">${t('notClosedYet')}</span>`}</td>
      </tr>`;
    },
    lang()==='fr'?'Aucune clôture sur les 7 derniers jours.':'No closings in the last 7 days.');
}

function formatLongDate(dateStr){
  const dt=new Date(dateStr+'T00:00:00');
  return dt.toLocaleDateString(lang()==='fr'?'fr-FR':'en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
}

// Save the variance justification text without closing the day (accountant can
// write the explanation first, review it, then close once confident).
async function saveJustification(dateStr){
  const text=el('justificationText')?.value?.trim()||'';
  if(!text){showNotice(t('justificationRequired'),'warn');return;}
  let cashRow=(rows.caisse||[]).find(r=>r.date===dateStr);
  if(isDemo()){
    if(cashRow) rows.caisse=rows.caisse.map(r=>r.date===dateStr?{...r,justification:text}:r);
    else rows.caisse.push({id:'demo-csh-'+Date.now(),date:dateStr,justification:text,statut:'Open'});
    render();showNotice(t('savedDemo'),'success');return;
  }
  setLoading(true);
  try{
    if(cashRow){
      const {error}=await client.from('caisse').update({justification:text}).eq('id',cashRow.id);
      if(error){showNotice(error.message,'error');return;}
    } else {
      const {error}=await client.from('caisse').insert({date:dateStr,justification:text,statut:'Open'});
      if(error){showNotice(error.message,'error');return;}
    }
    await refreshTable('caisse');render();showNotice(t('recordUpdated'),'success');
  } finally{setLoading(false);}
}

// Permanently closes the day's cash record. Blocked client-side if there's an
// unjustified variance, and the database CHECK constraint (chk_caisse_justification_required)
// blocks it server-side too — so this cannot be bypassed even via direct API access.
async function closeDailyCash(dateStr){
  const d=dailyClosingData(dateStr);
  if(d.hasVariance&&!d.isJustified){showNotice(t('varianceFlag'),'error');return;}
  if(!(await confirmAction(t('closingConfirm')))) return;
  const closedBy=session?.user?.email||(lang()==='fr'?'Compte local':'Local account');
  const payload={
    date:dateStr,
    soldeouverture:d.opening, entrees:d.totalIn, sorties:d.expTotal,
    soldetheorique:d.expected, cashreel:d.actual!=null?d.actual:d.expected,
    ecart:d.variance||0, justification:d.justification||null,
    statut:'Closed', closed_by:closedBy, closed_at:new Date().toISOString()
  };
  if(isDemo()){
    const existing=(rows.caisse||[]).find(r=>r.date===dateStr);
    if(existing) rows.caisse=rows.caisse.map(r=>r.date===dateStr?{...r,...payload}:r);
    else rows.caisse.push({id:'demo-csh-'+Date.now(),...payload});
    render();showNotice(t('closingSuccess'),'success');return;
  }
  setLoading(true);
  try{
    const existing=(rows.caisse||[]).find(r=>r.date===dateStr);
    const result=existing
      ? await client.from('caisse').update(payload).eq('id',existing.id)
      : await client.from('caisse').insert(payload);
    if(result.error){showNotice(result.error.message,'error');return;}
    await logActivity('daily_close','caisse',dateStr);
    await refreshTable('caisse');render();showNotice(t('closingSuccess'),'success');
  } finally{setLoading(false);}
}

// Builds a clean, copy-pasteable plain-text version of the day's summary —
// ready to paste into WhatsApp, SMS, or an email body today, and reusable
// verbatim as the email body once automated delivery is configured.
function copyDailySummary(dateStr){
  const d=dailyClosingData(dateStr);
  const L=lang()==='fr';
  const lines=[
    `${PROPERTY.name} — ${L?'Clôture journalière':'Daily closing'}`,
    formatLongDate(dateStr),
    '',
    `${L?'Loyers':'Rent'}: ${money(d.rentTotal)} (${d.rentPayments.length} ${L?'paiements':'payments'})`,
    `${L?'Recettes WC':'Toilet revenue'}: ${money(d.wcTotal)} (${d.wc.length})`,
    `${L?'Autres revenus':'Other revenue'}: ${money(d.otherTotal)} (${d.other.length})`,
    `${L?'TOTAL ENCAISSÉ':'TOTAL COLLECTED'}: ${money(d.totalIn)}`,
    '',
    `${L?'Dépenses':'Expenses'}: ${money(d.expTotal)} (${d.expenses.length})`,
    '',
    `${L?'Solde ouverture':'Opening cash'}: ${money(d.opening)}`,
    `${L?'Solde théorique':'Expected cash'}: ${money(d.expected)}`,
    `${L?'Cash réel':'Actual cash'}: ${d.actual!=null?money(d.actual):'—'}`,
    `${L?'Écart':'Variance'}: ${d.variance!=null?money(d.variance):'—'}${d.hasVariance?(d.isJustified?` — ${L?'Justifié':'Justified'}: ${d.justification}`:` — ${L?'NON JUSTIFIÉ':'NOT JUSTIFIED'}`):''}`,
    '',
    d.isClosed?`${L?'Clôturé par':'Closed by'} ${d.cashRow?.closed_by||''}`:(L?'Pas encore clôturé':'Not yet closed')
  ];
  const text=lines.join('\n');
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(()=>showNotice(t('summaryCopied'),'success')).catch(()=>fallbackCopy(text));
  } else fallbackCopy(text);
}
function fallbackCopy(text){
  const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.select();
  try{document.execCommand('copy'); showNotice(t('summaryCopied'),'success');}catch{}
  document.body.removeChild(ta);
}

// ── REPORTS ───────────────────────────────────────────────────────────────────
function getDateRange(){
  const from=el('fromDate')?.value||null,to=el('toDate')?.value||null;
  return {from,to};
}
function filteredByDate(records,dateField='date'){
  const {from,to}=getDateRange();
  return records.filter(r=>{
    const d=r[dateField]; if(!d) return true;
    if(from&&d<from) return false;
    if(to&&d>to)     return false;
    return true;
  });
}
function renderReports(){
  const m=metrics();
  const reports=[
    [t('occupancyReport'),`${m.occupied}/${m.inv.length}`,`${m.occupancy}% ${lang()==='fr'?'occupé':'occupied'}`],
    [t('revenueReport'),money(m.rentPaid),t('rentCollected')],
    [t('wcReport'),money(m.wcTotal),t('toilets')],
    [t('arrearsReport'),money(m.arrears),t('unpaidBalances')],
    [t('expenseReport'),money(m.out),t('opCosts')],
    [t('netResult'),money(m.net),t('revMinusExp')],
    [t('execSummary'),money(m.totalIn),t('totalRevLabel')]
  ];
  el('tablePage').innerHTML=`
    <div class="pageToolbar"><div><h3>${t('reportsTitle')}</h3><p>${t('reportsSub')}</p></div>
    <div class="tools">
      <input type="date" id="fromDate" onchange="renderReports()">
      <input type="date" id="toDate"   onchange="renderReports()">
      <button onclick="exportReportJson()">JSON</button>
      <button onclick="exportCurrentCsv('reports')">${t('exportJson').replace('JSON','Excel/CSV')}</button>
      <button onclick="window.print()">🖨 ${t('pdf')}</button>
    </div></div>
    <div class="reportGrid">${reports.map(r=>`<div class="card reportCard"><h3>${esc(r[0])}</h3><strong>${esc(String(r[1]))}</strong><p>${esc(r[2])}</p></div>`).join('')}</div>
    <div class="card section"><div class="sectionHead"><h3>${t('execSumTitle')}</h3><p>Centre Commercial Madina · ${monthKey()}</p></div><div class="summaryRows">${summaryRow(t('spaces'),m.inv.length)}${summaryRow(t('occupancyRate'),m.occupancy+'%')}${summaryRow(t('rentPaid'),money(m.rentPaid))}${summaryRow(t('wcTotal'),money(m.wcTotal))}${summaryRow(t('otherRevenue'),money(m.other))}${summaryRow(t('totalRevLabel'),money(m.totalIn))}${summaryRow(t('expenses'),money(m.out))}${summaryRow(t('profitLoss'),money(m.net),true)}</div></div>
  `;
}

// ── ALERTS ────────────────────────────────────────────────────────────────────
function renderAlerts(){
  const a=operationalAlerts();
  el('tablePage').innerHTML=`
    <div class="pageToolbar"><div><h3>${t('alertsTitle')}</h3><p>${t('alertsSub')}</p></div></div>
    ${a.total===0?`<div class="card section"><div class="emptyState">${t('noAlerts')}</div></div>`:''}
    ${a.expiringContracts.length?`<div class="card section"><div class="sectionHead"><h3>⚠ ${t('expiringContracts')}</h3><p>${a.expiringContracts.length}</p></div>${table([t('contractNo'),t('space'),t('tenant'),t('end'),t('daysLeft')],a.expiringContracts,r=>`<tr><td>${esc(r.numero)}</td><td><b>${esc(r.boutiquecode)}</b></td><td>${esc(r.locataire)}</td><td>${esc(r.datefin)}</td><td class="bold-amber">${daysUntil(r.datefin)} ${lang()==='fr'?'j':'d'}</td></tr>`)}</div>`:''}
    ${a.overdueRent.length?`<div class="card section"><div class="sectionHead"><h3>🔴 ${t('overdueRentsTitle')}</h3><p>${a.overdueRent.length}</p></div>${table([t('space'),t('tenant'),t('month'),t('balance'),t('penalty'),t('status')],a.overdueRent,r=>`<tr><td><b>${esc(r.boutiquecode)}</b></td><td>${esc(r.locataire)}</td><td>${esc(r.mois)}</td><td class="bold-red">${money(r.solde)}</td><td>${money(r.penalite)}</td><td>${statusBadge(r.statut)}</td></tr>`)}</div>`:''}
    ${a.openMaintenance.length?`<div class="card section"><div class="sectionHead"><h3>🔧 ${t('openMaintTitle')}</h3><p>${a.openMaintenance.length}</p></div>${table([t('date'),t('space'),t('description'),t('priority'),t('status')],a.openMaintenance,r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.espace)}</td><td>${esc(r.description)}</td><td>${statusBadge(r.priority)}</td><td>${statusBadge(r.statut)}</td></tr>`)}</div>`:''}
    ${a.vacantSpaces.length?`<div class="card section"><div class="sectionHead"><h3>🏪 ${t('vacantSpacesTitle')}</h3><p>${a.vacantSpaces.length} ${t('toRentOut')}</p></div>${table([t('spaceCode'),t('type'),t('zone'),t('area'),t('requestedRent')],a.vacantSpaces,r=>`<tr><td><b>${esc(r.codeespace)}</b></td><td>${esc(r.typeespace)}</td><td>${esc(r.zone)}</td><td>${esc(r.surface)}m²</td><td>${money(r.loyermensuel)}</td></tr>`)}</div>`:''}
  `;
}

// ── MAINTENANCE ───────────────────────────────────────────────────────────────
function renderMaintenance(){
  const data=filtered('maintenance');
  el('tablePage').innerHTML=pageShell(t('maintenanceTitle'),t('maintenanceSub'),'maintenance',`
    <div class="grid stats">${stat(t('openRequests'),data.filter(x=>/open|progress/i.test(x.statut||'')).length,t('inProgress'))}${stat(t('highPriority'),data.filter(x=>/high|urgent/i.test(x.priority||'')).length,t('urgent'))}${stat(t('maintenanceCost'),money(sum(data,'cost')),t('trackedSpend'))}${stat(t('contractors'),new Set(data.map(x=>x.contractor).filter(Boolean)).size,t('vendors'))}</div>
    ${table([t('date'),t('space'),t('requester'),t('description'),t('contractor'),t('cost'),t('priority'),t('status'),t('closeDate'),t('actions')],data,
      r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.espace)}</td><td>${esc(r.demandeur)}</td><td>${esc(r.description)}</td><td>${esc(r.contractor)}</td><td>${money(r.cost)}</td><td>${statusBadge(r.priority)}</td><td>${statusBadge(r.statut)}</td><td>${esc(r.closedate||'—')}</td><td>${actions('maintenance',r.id)}</td></tr>`)}
  `);
}

// ── USERS ─────────────────────────────────────────────────────────────────────
function renderUsers(){
  const data=filtered('profiles');
  el('tablePage').innerHTML=pageShell(t('usersTitle'),t('usersSub'),'profiles',`
    <div class="grid stats">${stat(t('users'),data.length,t('profiles'))}${stat(t('yourRole'),userRole,t('activeSession'))}${stat(t('activityLog'),(rows.activity_logs||[]).length,t('journal'))}${stat(lang()==='fr'?'Session':'Session',session?t('active'):(lang()==='fr'?'Non connecté':'Not signed in'),lang()==='fr'?'Compte actif':'Active account')}</div>
    ${table([t('email'),t('fullName'),t('role'),t('status'),t('actions')],data,
      r=>`<tr><td>${esc(r.email)}</td><td>${esc(r.fullname)}</td><td>${statusBadge(r.role)}</td><td>${statusBadge(r.statut)}</td><td>${actions('profiles',r.id)}</td></tr>`)}
    <div class="card section"><div class="sectionHead"><h3>${t('activityLogs')}</h3></div>${genericTable('activity_logs')}</div>
  `);
}

// ── DATA & BACKUP ─────────────────────────────────────────────────────────────
function renderData(){
  const isSA=userRole==='Super Admin';
  el('tablePage').innerHTML=`
    <div class="pageToolbar"><div><h3>${t('dataTitle')}</h3><p>${t('dataSub')}</p></div></div>
    <div class="grid stats">${stat(t('tablesLoaded'),Object.keys(rows).length,t('localCache'))}${stat(t('records'),Object.values(rows).reduce((a,r)=>a+(Array.isArray(r)?r.length:0),0),t('totalRows'))}${stat(t('production'),isDemo()?t('demo'):t('production'),t('dataSource'))}</div>
    <div class="card section"><div class="dataActions">
      ${isSA?`<button onclick="exportBackup()" class="primary">${t('backupJson')}</button>`:''}
      ${isSA?`<label class="fileBtn">${t('restoreJson')}<input type="file" accept=".json,application/json" onchange="restoreBackup(this.files[0])" hidden></label>`:''}
      <button onclick="validateImport()">${t('validateFile')}</button>
      <button onclick="loadAll()">${t('refresh')}</button>
      ${!isSA?`<span style="color:var(--muted);font-size:12px">${lang()==='fr'?'Sauvegarde et restauration réservées au Super Admin.':'Backup and restore require Super Admin role.'}</span>`:''}
    </div></div>
    <div class="card section"><div class="sectionHead"><h3>${t('loadedTables')}</h3></div>${table([t('table'),t('rows'),t('category')],TABLES,r=>`<tr><td>${esc(r[0])}</td><td>${(rows[r[0]]||[]).length}</td><td>${esc(r[2])}</td></tr>`)}</div>
  `;
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function renderSettings(){
  el('tablePage').innerHTML=`
    <div class="card section settingsPanel">
      <h3>${t('settingsTitle')}</h3>
      <div class="formGrid">
        <div class="field"><label>${t('langLabel')}</label><select id="langSelect"><option value="fr">Français</option><option value="en">English</option></select></div>
        <div class="field"><label>${t('themeLabel')}</label><select id="themeSelect"><option value="light">${t('lightTheme')}</option><option value="dark">${t('darkTheme')}</option></select></div>
      </div>
      <div style="margin-top:16px;padding:14px;background:var(--panel2);border-radius:8px;font-size:13px">
        <b>${PROPERTY.name}</b><br>
        ${PROPERTY.company} · ${PROPERTY.city}<br>
        Tel: ${PROPERTY.phone}<br>
        RCCM: ${PROPERTY.rccm} · NIF: ${PROPERTY.nif}<br>
        <span style="color:var(--muted)">NPMS Enterprise v${APP_VERSION}</span>
      </div>
    </div>
    ${userRole==='Super Admin'?`
    <div class="card section settingsPanel" style="margin-top:14px">
      <h3>${lang()==='fr'?'Mode démo':'Demo mode'}</h3>
      <p style="font-size:12px;color:var(--muted);margin-bottom:10px">${lang()==='fr'?'Le mode démo utilise des données fictives pour la formation et les démonstrations. Aucune donnée réelle n\'est modifiée.':'Demo mode uses sample data for training and demonstrations. No real data is modified.'}</p>
      <button onclick="localStorage.setItem('${DEMO_KEY}',isDemo()?'0':'1');loadAll();">${isDemo()?lang()==='fr'?'Quitter le mode démo':'Exit demo mode':lang()==='fr'?'Activer le mode démo':'Activate demo mode'}</button>
    </div>` : ''}`;
  el('langSelect').value=lang();
  el('themeSelect').value=prefs().theme||'light';
  el('langSelect').onchange=e=>{setPrefs({lang:e.target.value});render();};
  el('themeSelect').onchange=e=>{setPrefs({theme:e.target.value});render();};
}

// ── Page shell ────────────────────────────────────────────────────────────────
function pageShell(title,sub,tableName,inner){
  return `<div class="pageToolbar"><div><h3>${esc(title)}</h3><p>${esc(sub)}</p></div><div class="tools">
    <input class="searchInput" placeholder="${lang()==='fr'?'Rechercher…':'Search…'}" value="${esc(filters[tableName]||'')}" oninput="setFilter('${esc(tableName)}',this.value)">
    <button onclick="loadAll()">${t('refresh')}</button>
    ${can(current,'write')?`<button class="primary" onclick="openForm('${esc(tableName)}')">${t('add')}</button>`:''}
    <button onclick="exportCurrentCsv('${esc(tableName)}')">📥 CSV</button>
  </div></div>${inner}`;
}

// ── Filter & search ───────────────────────────────────────────────────────────
function filtered(tableId){
  const q=norm(filters[tableId]||''),data=rows[tableId]||[];
  if(!q) return data;
  const meta=tableMeta(tableId);
  const fields=meta?meta[3]:[];
  return data.filter(r=>fields.some(f=>!MONEY_FIELDS.has(f)&&norm(String(r[f]??'')).includes(q)));
}
function setFilter(tableId,value){
  filters[tableId]=value;
  clearTimeout(_filterTimer);
  _filterTimer=setTimeout(()=>render(),200);
}

// ── Data helpers ──────────────────────────────────────────────────────────────
function countBy(data,field){ return data.reduce((a,r)=>{const k=r[field]||'Autre';a[k]=(a[k]||0)+1;return a},{}); }
function sum(data,field){ return (data||[]).reduce((a,r)=>a+n(r[field]),0); }
function groupMoney(data,field){
  const by={};
  data.forEach(r=>{const k=String(r.date||'').slice(0,7);by[k]=(by[k]||0)+n(r[field]);});
  return Object.entries(by).sort().slice(-6).map(([label,value])=>({label,value}));
}
function summaryRow(a,b,total=false){ return `<div class="summaryRow ${total?'total':''}"><span>${esc(a)}</span><strong>${esc(String(b))}</strong></div>`; }
function emptyState(msg){ return `<div class="emptyState">${esc(msg)}</div>`; }
function paymentTimeline(r){ const pct=n(r.montant)?Math.min(100,Math.round(n(r.paye)/(n(r.montant)+n(r.penalite))*100)):0; return `<div class="progress"><b style="width:${pct}%"></b></div>`; }

function genericTable(tableName,limit=50){
  const meta=tableMeta(tableName);
  const all=filtered(tableName);
  const data=all.slice(0,limit);
  if(!meta) return '';
  const footer=all.length>limit?`<div style="padding:8px 12px;color:var(--muted);font-size:12px">Affichage ${limit}/${all.length} — exportez pour voir tout</div>`:'';
  return table([...meta[3].map(tr),'Actions'],data,
    r=>`<tr>${meta[3].map(f=>`<td>${MONEY_FIELDS.has(f)?money(r[f]):DATE_FIELDS.has(f)?esc(r[f]||''):statusCell(r[f])}</td>`).join('')}<td>${actions(tableName,r.id)}</td></tr>`)+footer;
}
function statusCell(v){ return /paid|active|open|confirmed|pending|occupied|variant|paye|actif|retard/i.test(String(v||''))?statusBadge(v):esc(v); }

// ── Form helpers ──────────────────────────────────────────────────────────────
function fieldInput(field,value){
  const type=MONEY_FIELDS.has(field)?'number':DATE_FIELDS.has(field)?'date':'text';
  if(field==='role'&&userRole!=='Super Admin'){
    return `<input name="${field}" type="text" value="${esc(value||'')}" readonly style="opacity:0.6;cursor:not-allowed">`;
  }
  if(['statut','role','risque','priority','mode','modepaiement','typeespace','etatmaintenance','renouvellement','collecteur'].includes(field)){
    return `<select name="${field}">${optionsFor(field).map(o=>`<option value="${esc(o)}" ${String(value)===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
  }
  if(['notes','description','details','communication'].some(x=>field.includes(x)))
    return `<textarea name="${field}" rows="3">${esc(value||'')}</textarea>`;
  return `<input name="${field}" type="${type}" value="${esc(value||'')}">`;
}
function optionsFor(field){
  return ({
    statut:['Active','Occupied','Vacant','Paid','Partial','Overdue','Pending','Confirmed','Open','In progress','Closed','Cancelled'],
    role:['Super Admin','Directeur','Comptable','Agent terrain','Caissier','Viewer'],
    risque:['Low','Medium','High'],
    priority:['Low','Medium','High','Urgent'],
    mode:['Espèces','Orange Money','Virement bancaire','Chèque','MTN Money'],
    modepaiement:['Espèces','Orange Money','Virement bancaire','Chèque','MTN Money'],
    typeespace:['Boutique','Container','Kiosque','Table','Toilettes','Autre'],
    etatmaintenance:['Good','Average','Needs repair','In maintenance'],
    renouvellement:['Manuel','Automatique'],
    collecteur:['Agent 1','Agent 2','Superviseur']
  })[field]||['Active','Pending'];
}

function openForm(tbl,id=''){
  if(!can(current,'write')){showNotice(t('accessDenied'),'error');return;}
  if(!client&&!isDemo()){showNotice(t('configureFirst'),'warn');return;}
  const meta=tableMeta(tbl); if(!meta) return;
  const record=(rows[tbl]||[]).find(r=>String(r.id)===String(id))||{};
  const fields=meta[3].filter(f=>f!=='id');
  el('modal').innerHTML=`<header><h3>${id?t('edit'):t('add')} — ${esc(meta[1])}</h3><button onclick="closeModal()">✕</button></header>
    <form id="editForm"><div class="formGrid">${fields.map(f=>`<div class="field ${['description','details','notes','communication'].includes(f)?'full':''}"><label>${esc(tr(f))}</label>${fieldInput(f,record[f])}</div>`).join('')}</div>
    <footer><button type="button" onclick="closeModal()">${t('cancel')}</button><button class="primary">${t('save')}</button></footer></form>`;
  el('modalBack').classList.add('show');
  el('editForm').onsubmit=async e=>saveRecord(e,tbl,id,fields);
}

async function saveRecord(e,tbl,id,fields){
  e.preventDefault();
  const payload={};
  fields.forEach(f=>payload[f]=MONEY_FIELDS.has(f)?n(e.target.elements[f].value):e.target.elements[f].value);
  if(tbl==='loyers') payload.solde=Math.max(0,n(payload.montant)+n(payload.penalite)-n(payload.paye));
  if(isDemo()){
    if(id) rows[tbl]=(rows[tbl]||[]).map(r=>String(r.id)===String(id)?{...r,...payload}:r);
    else (rows[tbl]||=[]).push({id:'demo-'+Date.now(),...payload});
    closeModal();render();showNotice(id?t('savedDemo'):t('addedDemo'),'success');return;
  }
  setLoading(true);
  try {
    const result=id?await client.from(tbl).update(payload).eq('id',id):await client.from(tbl).insert(payload);
    if(result.error) showNotice(result.error.message,'error');
    else{await logActivity(id?'update':'insert',tbl,id||'new');showNotice(id?t('recordUpdated'):t('recordAdded'),'success');closeModal();await refreshTable(tbl);render();}
  } finally{setLoading(false);}
}
function closeModal(){el('modalBack').classList.remove('show');}

// ── Login modal ───────────────────────────────────────────────────────────────
async function login(){
  if(!client){showNotice(t('connectFirst'),'warn');return;}
  el('modal').innerHTML=`
    <header><h3>${t('login')} — Centre Commercial Madina</h3><button onclick="closeModal()">✕</button></header>
    <form id="loginForm" style="padding:18px">
      <div class="field"><label>${t('email')}</label><input id="loginEmail" type="email" autocomplete="email" required placeholder="${lang()==='fr'?'votre@email.com':'you@email.com'}"></div>
      <div class="field" style="margin-top:10px"><label>${lang()==='fr'?'Mot de passe':'Password'}</label><input id="loginPwd" type="password" autocomplete="current-password" required placeholder="${lang()==='fr'?'Mot de passe':'Password'}"></div>
      <div id="loginErr" style="color:var(--red);font-size:13px;margin-top:8px;display:none"></div>
      <footer><button type="button" onclick="closeModal()">${t('cancel')}</button><button class="primary" type="submit">${t('login')}</button></footer>
    </form>`;
  el('modalBack').classList.add('show');
  setTimeout(()=>{const em=el('loginEmail');if(em)em.focus();},50);
  el('loginForm').onsubmit=async e=>{
    e.preventDefault();
    const errDiv=el('loginErr'); errDiv.style.display='none';
    setLoading(true);
    try{
      const {error}=await client.auth.signInWithPassword({email:el('loginEmail').value.trim(),password:el('loginPwd').value});
      if(error){errDiv.textContent=error.message;errDiv.style.display='block';}
      else{closeModal();await loadAll();}
    }finally{setLoading(false);}
  };
}
async function logout(){if(client)await client.auth.signOut();session=null;userRole='Viewer';await loadAll();}

// ── C-03: Atomic payment (RPC) ────────────────────────────────────────────────
async function recordPayment(rentId){
  const rent=(rows.loyers||[]).find(r=>r.id===rentId); if(!rent) return;
  el('modal').innerHTML=`
    <header><h3>${t('collectRent').replace(/^[^\\w]*/,'')} — ${esc(rent.locataire)}</h3><button onclick="closeModal()">✕</button></header>
    <form id="payForm" style="padding:18px">
      <div class="field"><label>${t('spaceLabel')}</label><input value="${esc(rent.boutiquecode)}" disabled></div>
      <div class="field" style="margin-top:8px"><label>${t('balanceDue')}</label><input value="${money(rent.solde||rent.montant)}" disabled style="color:var(--red);font-weight:700"></div>
      <div class="field" style="margin-top:8px"><label>${t('amountPaid')}</label><input id="payAmount" type="number" min="1" value="${n(rent.solde)||n(rent.montant)}" required></div>
      <div class="field" style="margin-top:8px"><label>${t('paymentMode')}</label>
        <select id="payMode"><option>${lang()==='fr'?'Espèces':'Cash'}</option><option>Orange Money</option><option>${lang()==='fr'?'Virement bancaire':'Bank transfer'}</option><option>${lang()==='fr'?'Chèque':'Cheque'}</option><option>MTN Money</option></select></div>
      <div id="payErr" style="color:var(--red);font-size:13px;margin-top:8px;display:none"></div>
      <footer><button type="button" onclick="closeModal()">${t('cancel')}</button><button class="primary" type="submit">${t('confirmPayment')}</button></footer>
    </form>`;
  el('modalBack').classList.add('show');
  setTimeout(()=>{const pa=el('payAmount');if(pa){pa.focus();pa.select();}},50);
  el('payForm').onsubmit=async e=>{
    e.preventDefault();
    const amount=n(el('payAmount').value),mode=el('payMode').value;
    const errDiv=el('payErr'); errDiv.style.display='none';
    if(!amount||amount<=0){errDiv.textContent=t('invalidAmount');errDiv.style.display='block';return;}
    const receipt=nextReceiptNumber(),reference='PAY-'+Date.now();
    if(isDemo()){
      const payment={id:'demo-pay-'+Date.now(),date:nowDate(),reference,numero_recu:receipt,payeur:rent.locataire,source:lang()==='fr'?'Loyer':'Rent',espace:rent.boutiquecode,montant:amount,mode,statut:'Confirmed',duplicata:'No'};
      const newPaye=n(rent.paye)+amount,newSolde=Math.max(0,n(rent.solde)-amount);
      rows.paiements.push(payment);
      rows.loyers=rows.loyers.map(r=>r.id===rentId?{...r,paye:newPaye,solde:newSolde,statut:newSolde?'Partial':'Paid'}:r);
      closeModal();showNotice(`${t('paymentDemo')} — ${receipt}`,'success');render();return;
    }
    setLoading(true);
    try{
      const {error}=await client.rpc('record_rent_payment',{p_rent_id:rentId,p_amount:amount,p_receipt:receipt,p_reference:reference,p_payeur:rent.locataire,p_espace:rent.boutiquecode,p_mode:mode});
      if(error){errDiv.textContent=t('paymentError')+': '+error.message;errDiv.style.display='block';}
      else{await logActivity('payment','loyers',receipt);closeModal();showNotice(`${t('paymentConfirmed')} — ${receipt}`,'success');await refreshTable('paiements');await refreshTable('loyers');render();}
    }finally{setLoading(false);}
  };
}

function nextReceiptNumber(){
  const now=new Date();
  const y=now.getFullYear();
  const ts=now.getTime().toString().slice(-7);
  return `REC-${y}-${ts}`;
}

// ── Receipt — Guinean official format ─────────────────────────────────────────
function amountWords(nbr){
  const fmt=Math.round(n(nbr)).toLocaleString('fr-FR');
  return lang()==='fr'?`${money(nbr)} (${fmt} Francs Guinéens)`:`${money(nbr)} (${fmt} Guinean Francs)`;
}

function receiptHtml(p){
  if(!p) return emptyState(t('selectPayment'));
  const now=new Date();
  const dateStr=now.toLocaleDateString(lang()==='fr'?'fr-FR':'en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  return `<div class="receiptBox">
    <div class="receiptHead">
      <div class="receiptLogo">M</div>
      <h3>${esc(PROPERTY.name)}</h3>
      <p>${esc(PROPERTY.company)}</p>
      <p>${esc(PROPERTY.city)}</p>
      <p>${lang()==='fr'?'Tél':'Tel'}: ${esc(PROPERTY.phone)}</p>
      <div class="receiptTitle">${t('receiptTitle')}</div>
      <strong>N° ${esc(p.numero_recu||p.reference)}</strong>
    </div>
    <div class="receiptBody">
      ${receiptRow(t('date'),dateStr)}
      ${receiptRow(t('receivedFrom'),p.payeur)}
      ${receiptRow(t('space'),p.espace)}
      ${receiptRow(t('paymentSource'),p.source)}
      ${receiptRow(t('paymentMode'),p.mode)}
      ${receiptRow(t('paymentRef'),p.reference)}
    </div>
    <div class="receiptAmount">
      <span>${t('amountReceived')}</span>
      <strong>${money(p.montant)}</strong>
    </div>
    <p class="amountWords">${esc(amountWords(p.montant))}</p>
    <div class="receiptSign">
      <div><div class="signLine"></div><p>${t('cashierSig')}</p></div>
      <div><div class="signLine"></div><p>${t('companySeal')}</p></div>
    </div>
    <p class="receiptFootNote">${t('officialDoc')} ${esc(PROPERTY.company)}.<br>${t('keepRecord')}</p>
    <div class="receiptFoot">
      <button onclick="printReceiptPage()">🖨 ${t('print')}</button>
      <button onclick="printReceiptPage()">📄 ${t('pdf')}</button>
    </div>
  </div>`;
}
function printReceiptPage(){
  document.body.classList.add('receipt-print');
  window.print();
  document.body.classList.remove('receipt-print');
}
function receiptRow(label,value){ return `<div class="receiptRow"><span>${esc(label)}</span><b>${esc(String(value||'—'))}</b></div>`; }
function previewReceipt(id){ const p=(rows.paiements||[]).find(x=>x.id===id); const box=el('receiptPreview'); if(box) box.innerHTML=receiptHtml(p); }

async function duplicateReceipt(id){
  const p=(rows.paiements||[]).find(x=>x.id===id); if(!p) return;
  const newRef='DUP-'+Date.now();
  const newReceipt=(p.numero_recu||p.reference)+'-D'+String(Date.now()).slice(-4);
  const copy={...p,id:undefined,reference:newRef,numero_recu:newReceipt,duplicata:'Yes'};
  if(isDemo()){rows.paiements.push({id:'demo-dup-'+Date.now(),...copy});render();showNotice(t('dupDemo'),'success');return;}
  setLoading(true);
  try{
    const {error}=await client.from('paiements').insert(copy);
    if(error) showNotice(error.message,'error');
    else{showNotice(`${t('duplicateCreated')}: ${newReceipt}`,'success');await refreshTable('paiements');render();}
  }finally{setLoading(false);}
}

// ── Month picker modal (replaces prompt()) ────────────────────────────────────
// Modal-based confirmation — replaces all browser confirm() calls.
// Works correctly in PWA/kiosk contexts where confirm() is suppressed.
function confirmAction(message){
  return new Promise(resolve=>{
    let resolved=false;
    const done=v=>{if(!resolved){resolved=true;closeModal();resolve(v);}};
    const L=lang()==='fr';
    el('modal').innerHTML=`
      <header><h3>${L?'Confirmation':'Confirmation'}</h3>
        <button type="button" id="confX">✕</button></header>
      <div style="padding:18px">
        <p style="margin:0 0 20px;line-height:1.6;font-size:14px">${esc(message)}</p>
        <footer>
          <button type="button" id="confCancel">${t('cancel')}</button>
          <button class="primary" id="confOk">${t('confirm')}</button>
        </footer>
      </div>`;
    el('modalBack').classList.add('show');
    setTimeout(()=>el('confOk')?.focus(),50);
    el('confX').onclick=()=>done(false);
    el('confCancel').onclick=()=>done(false);
    el('confOk').onclick=()=>done(true);
  });
}

function promptMonth(title){
  return new Promise(resolve=>{
    let resolved=false;
    const done=val=>{if(!resolved){resolved=true;closeModal();resolve(val||null);}};
    el('modal').innerHTML=`
      <header><h3>${esc(title)}</h3><button type="button" id="monthCancelX">✕</button></header>
      <form id="monthForm" style="padding:18px">
        <div class="field"><label>${lang()==='fr'?'Mois (AAAA-MM)':'Month (YYYY-MM)'}</label>
          <input id="monthInput" type="month" value="${monthKey()}" required></div>
        <footer>
          <button type="button" id="monthCancelBtn">${t('cancel')}</button>
          <button class="primary" type="submit">${t('save')}</button>
        </footer>
      </form>`;
    el('modalBack').classList.add('show');
    setTimeout(()=>el('monthInput')?.focus(),50);
    el('monthCancelX').onclick=()=>done(null);
    el('monthCancelBtn').onclick=()=>done(null);
    el('monthForm').onsubmit=e=>{
      e.preventDefault();
      const val=el('monthInput').value;
      if(val&&/^\d{4}-\d{2}$/.test(val)) done(val);
      else{showNotice(t('invalidMonth'),'error');done(null);}
    };
  });
}

// ── Generate monthly rent ─────────────────────────────────────────────────────
async function generateMonthlyRent(){
  const key=await promptMonth(lang()==='fr'?'Générer les loyers pour le mois':'Generate rent for month');
  if(!key) return;
  const today=nowDate(),dueDate=key+'-05';
  const spaces=(rows.inventaire||[]).filter(isOccupied);
  const payload=spaces
    .filter(s=>!(rows.loyers||[]).some(r=>r.boutiquecode===s.codeespace&&r.mois===key))
    .map(s=>({boutiquecode:s.codeespace,locataire:s.nomlocataireofficiel,mois:key,duedate:dueDate,montant:n(s.loyermensuel),paye:0,penalite:0,solde:n(s.loyermensuel),statut:today>dueDate?'Overdue':'Pending'}));
  if(!payload.length){showNotice(`${t('noGenerate')} ${key}.`,'info');return;}
  if(isDemo()){rows.loyers.push(...payload.map((p,i)=>({id:'demo-loy-'+Date.now()+i,...p})));render();showNotice(`${payload.length} ${t('generateDemo')}`,'success');return;}
  setLoading(true);
  try{
    const {error}=await client.from('loyers').insert(payload);
    if(error) showNotice(error.message,'error');
    else{showNotice(`${payload.length} ${t('rowsGenerated')} ${key}`,'success');await refreshTable('loyers');render();}
  }finally{setLoading(false);}
}

// ── Monthly closing ───────────────────────────────────────────────────────────
async function monthlyClosing(){
  const key=await promptMonth(lang()==='fr'?'Clôturer le mois':'Close month');
  if(!key) return;
  const monthRent=(rows.loyers||[]).filter(r=>r.mois===key);
  if(!monthRent.length){showNotice(lang()==='fr'?`Aucune ligne trouvée pour ${key}.`:`No rows found for ${key}.`,'warn');return;}
  if(!(await confirmAction(t('closeConfirm')))) return;
  const summary={titre:(lang()==='fr'?'Clôture mensuelle ':'Monthly closing ')+key,type:'MonthlyClose',reference:key,date:nowDate(),statut:'Complete'};
  if(isDemo()){
    rows.loyers=rows.loyers.map(r=>r.mois===key&&r.statut!=='Paid'?{...r,statut:'Closed'}:r);
    rows.archives=[...(rows.archives||[]),{id:'demo-arch-'+Date.now(),...summary}];
    render();showNotice(t('monthClosed'),'success');return;
  }
  setLoading(true);
  try{
    const ids=monthRent.filter(r=>r.statut!=='Paid').map(r=>r.id);
    if(ids.length){const {error:ue}=await client.from('loyers').update({statut:'Closed'}).in('id',ids);if(ue){showNotice('Error: '+ue.message,'error');return;}}
    const {error:ae}=await client.from('archives').insert(summary);
    if(ae){showNotice('Archive error: '+ae.message,'error');return;}
    await logActivity('monthly_close','rent',key);
    showNotice(`${t('closeSuccess')} ${ids.length} ${t('rowsUpdated')}`,'success');
    await refreshTable('loyers');await refreshTable('archives');render();
  }finally{setLoading(false);}
}

function openCommunication(name){
  navigate('tenants');openForm('communications');
  setTimeout(()=>{const f=el('editForm');if(f&&f.elements.locataire)f.elements.locataire.value=name;},0);
}

// Config functions removed — connection established automatically at startup.

// ── Legacy import / backup / restore ─────────────────────────────────────────
function legacyTableName(name){return LEGACY_MAP[name]||name;}
function cleanPayload(tbl,row){
  const meta=tableMeta(tbl);if(!meta) return null;
  const allowed=new Set(['id',...meta[3]]);const out={};
  Object.entries(row||{}).forEach(([k,v])=>{
    const key=FIELD_MAP[k]||FIELD_MAP[k.replace(/\s+/g,'_')]||String(k).toLowerCase();
    if(key==='id'&&!/^[0-9a-f-]{20,}$/i.test(String(v||''))) return;
    if(allowed.has(key)) out[key]=MONEY_FIELDS.has(key)?n(v):v;
  });
  if(tbl==='loyers') out.solde=n(out.solde)||Math.max(0,n(out.montant)+n(out.penalite)-n(out.paye));
  return Object.keys(out).length?out:null;
}
async function importLegacyJson(file){
  if(!client&&!isDemo()){showNotice(t('connectFirst'),'warn');return;}
  if(file.size>10*1024*1024){showNotice(t('fileTooLarge'),'error');return;}
  let parsed;try{parsed=JSON.parse(await file.text());}catch{showNotice(t('invalidJson'),'error');return;}
  const db=parsed.db||parsed.state?.db||parsed;
  if(!db||typeof db!=='object'){showNotice(t('unsupportedFormat'),'error');return;}
  let total=0;
  for(const [legacyName,legacyRows] of Object.entries(db)){
    const tbl=legacyTableName(legacyName);
    if(!tableMeta(tbl)||!Array.isArray(legacyRows)||!legacyRows.length) continue;
    const payload=legacyRows.map(r=>cleanPayload(tbl,r)).filter(Boolean);
    if(!payload.length) continue;
    if(isDemo()) rows[tbl]=[...(rows[tbl]||[]),...payload.map((p,i)=>({id:p.id||'demo-imp-'+Date.now()+i,...p}))];
    else{const {error}=await client.from(tbl).upsert(payload,{onConflict:'id'});if(error){showNotice(`${t('importError')} ${tbl}: ${error.message}`,'error');return;}}
    total+=payload.length;
  }
  showNotice(`${t('importComplete')} ${total}`,'success');await loadAll();
}
function exportBackup(){
  if(userRole!=='Super Admin'){showNotice(t('accessDenied'),'error');return;}
  const blob=new Blob([JSON.stringify({version:`NPMS Enterprise v${APP_VERSION}`,property:PROPERTY.name,exportedAt:new Date().toISOString(),rows},null,2)],{type:'application/json'});
  download(blob,`npms-madina-backup-${nowDate()}.json`);
  showNotice(t('exportSuccess'),'success');
}
async function restoreBackup(file){
  if(!file) return;
  if(userRole!=='Super Admin'){showNotice(t('accessDenied'),'error');return;}
  if(file.size>10*1024*1024){showNotice(t('fileTooLarge'),'error');return;}
  let parsed;try{parsed=JSON.parse(await file.text());}catch{showNotice(t('invalidJson'),'error');return;}
  const backup=parsed.rows||parsed;
  if(!backup||typeof backup!=='object'||Array.isArray(backup)){showNotice(t('unsupportedFormat'),'error');return;}
  if(!(await confirmAction(`${t('restoreConfirm')} ${Object.keys(backup).length} ${t('tablesWord')}`))) return;
  if(isDemo()){rows=backup;render();showNotice(t('restoredDemo'),'success');return;}
  if(!client){showNotice(t('connectFirst'),'warn');return;}
  setLoading(true);
  try{
    for(const [tbl,data] of Object.entries(backup)){
      if(tableMeta(tbl)&&Array.isArray(data)&&data.length){
        const {error}=await client.from(tbl).upsert(data,{onConflict:'id'});
        if(error){showNotice(`${t('restoreError')} ${tbl}: ${error.message}`,'error');return;}
      }
    }
    await logActivity('restore','all',`${file.name} — ${Object.keys(backup).length} tables`);
    showNotice(t('restoreSuccess'),'success');await loadAll();
  }finally{setLoading(false);}
}
function validateImport(){
  const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
  input.onchange=async e=>{
    const file=e.target.files[0];if(!file) return;
    if(file.size>10*1024*1024){showNotice(t('fileTooLarge'),'error');return;}
    let parsed;try{parsed=JSON.parse(await file.text());}catch{showNotice(t('invalidJson'),'error');return;}
    const backup=parsed.rows||parsed.db||parsed.state?.db||parsed;
    const lines=[];
    for(const [tbl,data] of Object.entries(backup)){
      if(!Array.isArray(data)){lines.push('⚠ '+tbl+t('notArray'));continue;}
      const known=!!tableMeta(tbl);
      const moneyOk=data.every(r=>[...MONEY_FIELDS].every(f=>!(f in r)||!isNaN(Number(r[f]))));
      lines.push((known?'✓ ':`⚠ ${t('unknownTable')} `)+'  '+tbl+' : '+data.length+(moneyOk?'':t('moneyWarn')));
    }
    el('modal').innerHTML=`<header><h3>${t('validationTitle')}</h3><button onclick="closeModal()">✕</button></header>
      <div style="padding:18px;font-family:monospace;font-size:13px;line-height:1.9">${lines.map(l=>`<div>${esc(l)}</div>`).join('')}</div>`;
    el('modalBack').classList.add('show');
  };
  input.click();
}
function exportReportJson(){
  const {from,to}=getDateRange();
  const f2={};
  for(const [tbl,data] of Object.entries(rows)) f2[tbl]=(from||to)?filteredByDate(data||[]):data;
  const blob=new Blob([JSON.stringify({version:`NPMS Enterprise v${APP_VERSION}`,property:PROPERTY.name,exportedAt:new Date().toISOString(),from,to,rows:f2},null,2)],{type:'application/json'});
  download(blob,`npms-report-${nowDate()}.json`);
}
function exportCurrentCsv(name){
  let records=rows[name]||[];
  if(name==='finance') records=[...(rows.paiements||[]),...(rows.revenus||[]),...(rows.depenses||[]),...(rows.recettes_wc||[])];
  if(name==='reports') records=Object.entries(metrics()).filter(([,v])=>typeof v!=='object').map(([metric,value])=>({metric,value}));
  if(['paiements','revenus','depenses','loyers','recettes_wc'].includes(name)) records=filteredByDate(records);
  const csv=toCsv(records);
  if(!csv){showNotice(t('noDataExport'),'warn');return;}
  download(new Blob([csv],{type:'text/csv'}),`npms-${name}-${nowDate()}.csv`);
}
function toCsv(data){
  if(!data.length) return '';
  const headers=[...new Set(data.flatMap(r=>Object.keys(r)))];
  return [headers.join(','),...data.map(r=>headers.map(h=>`"${String(r[h]??'').replace(/"/g,'""')}"`).join(','))].join('\n');
}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href);}

async function logActivity(action,module,details){
  if(!client) return;
  try{await client.from('activity_logs').insert({date:new Date().toISOString(),action,module,utilisateur:session?.user?.email||'local',details:String(details).slice(0,500)});}catch{}
}

// ── Boot ──────────────────────────────────────────────────────────────────────
el('loginBtn').onclick=login;
el('logoutBtn').onclick=logout;
el('langToggleBtn').onclick=()=>{setPrefs({lang:lang()==='fr'?'en':'fr'});render();};
el('modalBack').onclick=e=>{if(e.target.id==='modalBack')closeModal();};

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').then(reg=>{
    reg.addEventListener('updatefound',()=>{
      const nw=reg.installing;
      nw.addEventListener('statechange',()=>{
        if(nw.state==='installed'&&navigator.serviceWorker.controller) showNotice(t('swUpdate'),'info');
      });
    });
  }).catch(e=>console.warn('SW:',e));
}

initClient();
loadAll();
