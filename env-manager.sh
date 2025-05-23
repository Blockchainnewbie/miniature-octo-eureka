#!/bin/bash
# Docker Environment Manager - Einfaches Wechseln zwischen den Umgebungen

# Farbdefinitionen
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktionen
show_help() {
    echo -e "${BLUE}=== Docker Environment Manager ===${NC}"
    echo -e "Einfaches Management der verschiedenen Docker-Umgebungen"
    echo
    echo -e "${YELLOW}Verwendung:${NC}"
    echo -e "  $0 [command]"
    echo
    echo -e "${YELLOW}Commands:${NC}"
    echo -e "  ${GREEN}dev${NC}            Startet die Entwicklungsumgebung (Backend + DB)"
    echo -e "  ${GREEN}dev-stop${NC}       Stoppt die Entwicklungsumgebung"
    echo -e "  ${GREEN}prod${NC}           Startet die lokale Produktionssimulation (Backend + Frontend + DB + Redis)"
    echo -e "  ${GREEN}prod-stop${NC}      Stoppt die lokale Produktionssimulation"
    echo -e "  ${GREEN}ci${NC}             Führt die CI-Tests lokal aus"
    echo -e "  ${GREEN}ci-stop${NC}        Stoppt die CI-Umgebung"
    echo -e "  ${GREEN}cleanup${NC}        Bereinigt alle Docker-Ressourcen (Container, Volumes, Netzwerke)"
    echo -e "  ${GREEN}status${NC}         Zeigt den Status aller Umgebungen an"
    echo -e "  ${GREEN}logs [env]${NC}     Zeigt die Logs einer bestimmten Umgebung (dev, prod, ci)"
    echo -e "  ${GREEN}help${NC}           Zeigt diese Hilfe an"
    echo
    echo -e "${YELLOW}Beispiele:${NC}"
    echo -e "  $0 dev         # Startet die Entwicklungsumgebung"
    echo -e "  $0 prod        # Startet die Produktionssimulation"
    echo -e "  $0 logs dev    # Zeigt die Logs der Entwicklungsumgebung"
}

start_dev() {
    echo -e "${BLUE}Starte Entwicklungsumgebung...${NC}"
    docker compose -f docker-compose.dev.yml up -d
    echo -e "${GREEN}Entwicklungsumgebung gestartet!${NC}"
    echo -e "\n${YELLOW}Backend läuft auf:${NC} http://localhost:5000"
    echo -e "${YELLOW}MySQL läuft auf:${NC} localhost:43306"
    echo -e "\n${YELLOW}Frontend muss separat gestartet werden mit:${NC}"
    echo -e "cd frontend && npm run dev"
}

stop_dev() {
    echo -e "${BLUE}Stoppe Entwicklungsumgebung...${NC}"
    docker compose -f docker-compose.dev.yml down
    echo -e "${GREEN}Entwicklungsumgebung gestoppt!${NC}"
}

start_prod() {
    echo -e "${BLUE}Starte lokale Produktionssimulation...${NC}"
    docker compose -f docker-compose.prod.local.yml up -d
    echo -e "${GREEN}Produktionssimulation gestartet!${NC}"
    echo -e "\n${YELLOW}Frontend läuft auf:${NC} http://localhost:3000"
    echo -e "${YELLOW}Backend läuft auf:${NC} http://localhost:5000"
    echo -e "${YELLOW}MySQL und Redis laufen intern (nicht extern verfügbar)${NC}"
}

stop_prod() {
    echo -e "${BLUE}Stoppe lokale Produktionssimulation...${NC}"
    docker compose -f docker-compose.prod.local.yml down
    echo -e "${GREEN}Produktionssimulation gestoppt!${NC}"
}

start_ci() {
    echo -e "${BLUE}Starte CI-Tests...${NC}"
    docker compose -f docker-compose.ci.yml up --build
    echo -e "${GREEN}CI-Tests abgeschlossen!${NC}"
}

stop_ci() {
    echo -e "${BLUE}Stoppe CI-Umgebung...${NC}"
    docker compose -f docker-compose.ci.yml down
    echo -e "${GREEN}CI-Umgebung gestoppt!${NC}"
}

show_logs() {
    if [ -z "$1" ]; then
        echo -e "${RED}Bitte gib die Umgebung an (dev, prod, ci)${NC}"
        return 1
    fi

    case $1 in
        dev)
            docker compose -f docker-compose.dev.yml logs -f
            ;;
        prod)
            docker compose -f docker-compose.prod.local.yml logs -f
            ;;
        ci)
            docker compose -f docker-compose.ci.yml logs -f
            ;;
        *)
            echo -e "${RED}Ungültige Umgebung. Verwende 'dev', 'prod' oder 'ci'${NC}"
            return 1
            ;;
    esac
}

show_status() {
    echo -e "${BLUE}=== Docker Compose Status ===${NC}"
    echo
    echo -e "${YELLOW}Laufende Container:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo
    echo -e "${YELLOW}Docker Networks:${NC}"
    docker network ls --filter "name=car_monitoring*" --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"
    echo
    echo -e "${YELLOW}Docker Volumes:${NC}"
    docker volume ls --filter "name=car_monitoring*" --format "table {{.Name}}\t{{.Driver}}"
}

cleanup_all() {
    echo -e "${RED}WARNUNG: Alle Docker-Ressourcen werden gelöscht!${NC}"
    echo -e "Dies stoppt alle Container und löscht alle Volumes der Car-Monitoring-Umgebungen."
    read -p "Fortfahren? (j/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Jj]$ ]]; then
        echo -e "${BLUE}Stoppe alle Umgebungen...${NC}"
        docker compose -f docker-compose.dev.yml down -v 2>/dev/null
        docker compose -f docker-compose.prod.local.yml down -v 2>/dev/null
        docker compose -f docker-compose.ci.yml down -v 2>/dev/null
        docker compose down -v 2>/dev/null
        
        echo -e "${BLUE}Lösche Docker Volumes...${NC}"
        docker volume rm $(docker volume ls -q --filter "name=car_monitoring*") 2>/dev/null || true
        
        echo -e "${BLUE}Lösche Docker Networks...${NC}"
        docker network rm $(docker network ls -q --filter "name=car_monitoring*") 2>/dev/null || true
        
        echo -e "${GREEN}Bereinigung abgeschlossen!${NC}"
    else
        echo -e "${YELLOW}Bereinigung abgebrochen.${NC}"
    fi
}

# Hauptlogik
case "$1" in
    dev)
        start_dev
        ;;
    dev-stop)
        stop_dev
        ;;
    prod)
        start_prod
        ;;
    prod-stop)
        stop_prod
        ;;
    ci)
        start_ci
        ;;
    ci-stop)
        stop_ci
        ;;
    logs)
        show_logs "$2"
        ;;
    status)
        show_status
        ;;
    cleanup)
        cleanup_all
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        exit 1
        ;;
esac

exit 0
