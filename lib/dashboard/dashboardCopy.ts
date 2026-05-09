export type DashboardCopy = {
  subtitle: string
  spotlight: string
  spotlightToday: string
  spotlightNext: string
  spotlightOverdue: string
  spotlightUrgentToday: string
  spotlightUrgentOverdue: string
  spotlightUrgentNext: string
  completeTask: string
  alerts: string
  overdueTasks: string
  urgentTasks: string
  todayTasks: string
  upcomingTasks: string
  quickActions: string
  quickActionNewTask: string
  quickActionTasks: string
  quickActionInventory: string
  quickActionAgenda: string
  activeProblems: string
  noActiveProblems: string
  smartReminders: string
  noSmartReminders: string
  hotAreas: string
  noHotAreas: string
  singleHotAreaTask: string
  hotAreaTasks: string
  quickHistory: string
  noHistoryToday: string
  completedAtLabel: string
  viewAll: string
  noTasks: string
  noTodayTasks: string
  noUpcomingTasks: string
  noOverdueTasks: string
  noUrgentTasks: string
  todayWord: string
  tomorrowWord: string
}

export function getConciergeDashboardCopy(locale: string): DashboardCopy {
  if (locale.startsWith('fr')) {
    return {
      subtitle: 'On va passer une belle journee',
      spotlight: 'Le plus important maintenant',
      spotlightToday: "Aujourd'hui",
      spotlightNext: 'Prochaine tache',
      spotlightOverdue: 'En retard',
      spotlightUrgentToday: "Urgente aujourd'hui",
      spotlightUrgentOverdue: 'Urgente et en retard',
      spotlightUrgentNext: 'Prochaine urgente',
      completeTask: 'Terminer la tache',
      alerts: 'Alertes',
      overdueTasks: 'Taches en retard',
      urgentTasks: 'Taches urgentes',
      todayTasks: "Taches d'aujourd'hui",
      upcomingTasks: 'Prochaines taches',
      quickActions: 'Raccourcis',
      quickActionNewTask: 'Nouvelle tache',
      quickActionTasks: 'Voir taches',
      quickActionInventory: 'Inventaire',
      quickActionAgenda: 'Voir agenda',
      activeProblems: 'Problemes actifs',
      noActiveProblems: 'Aucun probleme actif.',
      smartReminders: 'Rappels intelligents',
      noSmartReminders: 'Aucun rappel pour le moment.',
      hotAreas: 'Zones chaudes',
      noHotAreas: 'Aucune zone a surveiller.',
      singleHotAreaTask: '1 tache',
      hotAreaTasks: '{count} taches',
      quickHistory: 'Historique du jour',
      noHistoryToday: "Aucune tache completee aujourd'hui.",
      completedAtLabel: 'Completee',
      viewAll: 'Voir tout',
      noTasks: 'Aucune tache pour le moment.',
      noTodayTasks: "Aucune tache pour aujourd'hui.",
      noUpcomingTasks: 'Aucune tache a venir.',
      noOverdueTasks: 'Aucune tache en retard.',
      noUrgentTasks: 'Aucune tache urgente.',
      todayWord: "Aujourd'hui",
      tomorrowWord: 'Demain',
    }
  }

  if (locale.startsWith('ru')) {
    return {
      subtitle: 'Segodnya budet otlichnyy den',
      spotlight: 'Samoye vazhnoye seychas',
      spotlightToday: 'Na segodnya',
      spotlightNext: 'Sleduyushchaya zadacha',
      spotlightOverdue: 'Prosrochena',
      spotlightUrgentToday: 'Srochnaya segodnya',
      spotlightUrgentOverdue: 'Srochnaya i prosrochena',
      spotlightUrgentNext: 'Sleduyushchaya srochnaya',
      completeTask: 'Zavershit zadachu',
      alerts: 'Preduprezhdeniya',
      overdueTasks: 'Prosrochennye zadachi',
      urgentTasks: 'Srochnye zadachi',
      todayTasks: 'Zadachi na segodnya',
      upcomingTasks: 'Sleduyushchie zadachi',
      quickActions: 'Bystrye deystviya',
      quickActionNewTask: 'Novaya zadacha',
      quickActionTasks: 'Vse zadachi',
      quickActionInventory: 'Inventar',
      quickActionAgenda: 'Otkryt kalendar',
      activeProblems: 'Aktivnye problemy',
      noActiveProblems: 'Net aktivnykh problem.',
      smartReminders: 'Umnye napominaniya',
      noSmartReminders: 'Napominaniy poka net.',
      hotAreas: 'Goryachie zony',
      noHotAreas: 'Net zon dlya kontrolya.',
      singleHotAreaTask: '1 zadacha',
      hotAreaTasks: '{count} zadachi',
      quickHistory: 'Istoriya za den',
      noHistoryToday: 'Segodnya net zavershennykh zadach.',
      completedAtLabel: 'Zavershena',
      viewAll: 'Smotret vse',
      noTasks: 'Poka net zadach.',
      noTodayTasks: 'Na segodnya zadach net.',
      noUpcomingTasks: 'Net predstoyashchikh zadach.',
      noOverdueTasks: 'Net prosrochennykh zadach.',
      noUrgentTasks: 'Net srochnykh zadach.',
      todayWord: 'Segodnya',
      tomorrowWord: 'Zavtra',
    }
  }

  if (locale.startsWith('en')) {
    return {
      subtitle: 'We are going to have a great day',
      spotlight: 'Most important now',
      spotlightToday: 'Today',
      spotlightNext: 'Next task',
      spotlightOverdue: 'Overdue',
      spotlightUrgentToday: 'Urgent today',
      spotlightUrgentOverdue: 'Urgent and overdue',
      spotlightUrgentNext: 'Next urgent',
      completeTask: 'Complete task',
      alerts: 'Alerts',
      overdueTasks: 'Overdue tasks',
      urgentTasks: 'Urgent tasks',
      todayTasks: 'Today tasks',
      upcomingTasks: 'Upcoming tasks',
      quickActions: 'Quick actions',
      quickActionNewTask: 'New task',
      quickActionTasks: 'View tasks',
      quickActionInventory: 'Inventory',
      quickActionAgenda: 'Open agenda',
      activeProblems: 'Active problems',
      noActiveProblems: 'No active problems.',
      smartReminders: 'Smart reminders',
      noSmartReminders: 'No reminders for now.',
      hotAreas: 'Hot areas',
      noHotAreas: 'No hot areas right now.',
      singleHotAreaTask: '1 task',
      hotAreaTasks: '{count} tasks',
      quickHistory: 'Today history',
      noHistoryToday: 'No completed tasks today.',
      completedAtLabel: 'Completed',
      viewAll: 'View all',
      noTasks: 'No tasks for now.',
      noTodayTasks: 'No tasks for today.',
      noUpcomingTasks: 'No upcoming tasks.',
      noOverdueTasks: 'No overdue tasks.',
      noUrgentTasks: 'No urgent tasks.',
      todayWord: 'Today',
      tomorrowWord: 'Tomorrow',
    }
  }

  return {
    subtitle: 'Vamos a tener un gran dia',
    spotlight: 'Lo mas importante ahora',
    spotlightToday: 'De hoy',
    spotlightNext: 'Proxima tarea',
    spotlightOverdue: 'Atrasada',
    spotlightUrgentToday: 'Urgente hoy',
    spotlightUrgentOverdue: 'Urgente y atrasada',
    spotlightUrgentNext: 'Proxima urgente',
    completeTask: 'Completar tarea',
    alerts: 'Alertas',
    overdueTasks: 'Tareas atrasadas',
    urgentTasks: 'Tareas urgentes',
    todayTasks: 'Tareas de hoy',
    upcomingTasks: 'Proximas tareas',
    quickActions: 'Atajos rapidos',
    quickActionNewTask: 'Nueva tarea',
    quickActionTasks: 'Ver tareas',
    quickActionInventory: 'Inventario',
    quickActionAgenda: 'Ver agenda',
    activeProblems: 'Problemas activos',
    noActiveProblems: 'No hay problemas activos.',
    smartReminders: 'Recordatorios inteligentes',
    noSmartReminders: 'No hay recordatorios por ahora.',
    hotAreas: 'Areas calientes',
    noHotAreas: 'No hay areas para vigilar ahora.',
    singleHotAreaTask: '1 tarea',
    hotAreaTasks: '{count} tareas',
    quickHistory: 'Historial rapido del dia',
    noHistoryToday: 'No hay tareas completadas hoy.',
    completedAtLabel: 'Completada',
    viewAll: 'Ver todas',
    noTasks: 'No hay tareas por ahora.',
    noTodayTasks: 'No hay tareas para hoy.',
    noUpcomingTasks: 'No hay proximas tareas.',
    noOverdueTasks: 'No hay tareas atrasadas.',
    noUrgentTasks: 'No hay tareas urgentes.',
    todayWord: 'Hoy',
    tomorrowWord: 'Manana',
  }
}
