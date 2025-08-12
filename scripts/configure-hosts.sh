#!/bin/bash

# ============================================
# CONFIGURAR HOSTS FILE PARA test.precivox.com.br
# Script para Windows/Linux/MacOS
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Detectar sistema operacional
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# Obter caminho do arquivo hosts
get_hosts_file() {
    local os=$(detect_os)
    case $os in
        linux|macos)
            echo "/etc/hosts"
            ;;
        windows)
            echo "C:\\Windows\\System32\\drivers\\etc\\hosts"
            ;;
        *)
            log_error "Sistema operacional não suportado: $OSTYPE"
            exit 1
            ;;
    esac
}

# Verificar se a entrada já existe
check_existing_entry() {
    local hosts_file="$1"
    local os=$(detect_os)
    
    if [[ $os == "windows" ]]; then
        # Para Windows (usando PowerShell se disponível)
        if command -v powershell.exe > /dev/null 2>&1; then
            powershell.exe -Command "Get-Content '$hosts_file' | Select-String 'test.precivox.com.br'" > /dev/null 2>&1
        else
            # Fallback para sistemas com WSL ou similar
            grep -q "test.precivox.com.br" "$hosts_file" 2>/dev/null || return 1
        fi
    else
        grep -q "test.precivox.com.br" "$hosts_file" 2>/dev/null || return 1
    fi
}

# Adicionar entrada ao arquivo hosts
add_hosts_entry() {
    local hosts_file="$1"
    local os=$(detect_os)
    local entry="127.0.0.1    test.precivox.com.br"
    
    log_info "🔧 Adicionando entrada ao arquivo hosts..."
    
    if [[ $os == "windows" ]]; then
        # Para Windows
        if command -v powershell.exe > /dev/null 2>&1; then
            log_info "📝 Usando PowerShell para modificar hosts..."
            powershell.exe -Command "
                \$hostsFile = '$hosts_file'
                \$entry = '$entry'
                Add-Content -Path \$hostsFile -Value \$entry
                Write-Host 'Entrada adicionada com sucesso!'
            "
        else
            log_warning "⚠️  PowerShell não encontrado. Adição manual necessária."
            show_manual_instructions "$entry" "$hosts_file"
            return 1
        fi
    else
        # Para Linux/MacOS
        if [[ $EUID -eq 0 ]]; then
            echo "$entry" >> "$hosts_file"
        else
            echo "$entry" | sudo tee -a "$hosts_file" > /dev/null
        fi
    fi
}

# Remover entrada do arquivo hosts
remove_hosts_entry() {
    local hosts_file="$1"
    local os=$(detect_os)
    
    log_info "🗑️  Removendo entrada do arquivo hosts..."
    
    if [[ $os == "windows" ]]; then
        if command -v powershell.exe > /dev/null 2>&1; then
            powershell.exe -Command "
                \$hostsFile = '$hosts_file'
                \$content = Get-Content \$hostsFile | Where-Object { \$_ -notmatch 'test\.precivox\.com' }
                Set-Content -Path \$hostsFile -Value \$content
                Write-Host 'Entrada removida com sucesso!'
            "
        else
            log_warning "⚠️  PowerShell não encontrado. Remoção manual necessária."
            show_manual_removal_instructions "$hosts_file"
            return 1
        fi
    else
        if [[ $EUID -eq 0 ]]; then
            sed -i '/test\.precivox\.com/d' "$hosts_file"
        else
            sudo sed -i '/test\.precivox\.com/d' "$hosts_file"
        fi
    fi
}

# Mostrar instruções manuais
show_manual_instructions() {
    local entry="$1"
    local hosts_file="$2"
    
    echo ""
    log_warning "📋 INSTRUÇÕES MANUAIS:"
    echo ""
    echo "1. Abra o Bloco de Notas como Administrador"
    echo "2. Abra o arquivo: $hosts_file"
    echo "3. Adicione esta linha no final do arquivo:"
    echo "   $entry"
    echo "4. Salve o arquivo"
    echo "5. Reinicie o navegador"
    echo ""
}

# Mostrar instruções de remoção manual
show_manual_removal_instructions() {
    local hosts_file="$1"
    
    echo ""
    log_warning "📋 INSTRUÇÕES DE REMOÇÃO MANUAL:"
    echo ""
    echo "1. Abra o Bloco de Notas como Administrador"
    echo "2. Abra o arquivo: $hosts_file"
    echo "3. Encontre e delete a linha que contém: test.precivox.com.br"
    echo "4. Salve o arquivo"
    echo "5. Reinicie o navegador"
    echo ""
}

# Verificar conectividade
test_connectivity() {
    log_info "🌐 Testando conectividade..."
    
    # Aguardar DNS cache limpar
    sleep 2
    
    # Testar resolução DNS
    if command -v nslookup > /dev/null 2>&1; then
        log_info "🔍 Testando resolução DNS..."
        nslookup test.precivox.com.br 2>/dev/null || log_warning "⚠️  DNS ainda não atualizado (normal)"
    fi
    
    # Testar conectividade HTTP (se o serviço estiver rodando)
    if curl -f http://test.precivox.com.br:3002/api/admin/status > /dev/null 2>&1; then
        log_success "✅ test.precivox.com.br:3002 está acessível!"
    elif curl -f http://test.precivox.com.br:80 > /dev/null 2>&1; then
        log_success "✅ test.precivox.com.br:80 está acessível!"
    else
        log_warning "⚠️  Serviços não estão rodando ainda. Execute o deploy primeiro."
    fi
}

# Limpar cache DNS
flush_dns_cache() {
    local os=$(detect_os)
    
    log_info "🔄 Limpando cache DNS..."
    
    case $os in
        windows)
            if command -v ipconfig.exe > /dev/null 2>&1; then
                ipconfig.exe /flushdns
            elif command -v powershell.exe > /dev/null 2>&1; then
                powershell.exe -Command "Clear-DnsClientCache"
            else
                log_warning "⚠️  Não foi possível limpar o cache DNS automaticamente"
                echo "Execute manualmente: ipconfig /flushdns"
            fi
            ;;
        macos)
            sudo dscacheutil -flushcache
            sudo killall -HUP mDNSResponder
            ;;
        linux)
            if command -v systemctl > /dev/null 2>&1; then
                sudo systemctl flush-dns 2>/dev/null || true
            fi
            if command -v resolvectl > /dev/null 2>&1; then
                sudo resolvectl flush-caches 2>/dev/null || true
            fi
            ;;
    esac
}

# Função principal
main() {
    local action="${1:-add}"
    local hosts_file=$(get_hosts_file)
    local os=$(detect_os)
    
    log_info "🖥️  Sistema detectado: $os"
    log_info "📁 Arquivo hosts: $hosts_file"
    
    case $action in
        add)
            if check_existing_entry "$hosts_file"; then
                log_warning "⚠️  Entrada para test.precivox.com.br já existe!"
                read -p "Deseja substituir? (y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    remove_hosts_entry "$hosts_file"
                    add_hosts_entry "$hosts_file"
                else
                    log_info "❌ Operação cancelada"
                    exit 0
                fi
            else
                add_hosts_entry "$hosts_file"
            fi
            
            flush_dns_cache
            test_connectivity
            
            log_success "✅ Configuração concluída!"
            echo ""
            echo "🌐 Agora você pode acessar:"
            echo "  - http://test.precivox.com.br:3002/api/admin/status"
            echo "  - http://test.precivox.com.br (quando o frontend estiver rodando)"
            echo ""
            ;;
            
        remove)
            if check_existing_entry "$hosts_file"; then
                remove_hosts_entry "$hosts_file"
                flush_dns_cache
                log_success "✅ Entrada removida com sucesso!"
            else
                log_warning "⚠️  Entrada não encontrada no arquivo hosts"
            fi
            ;;
            
        check)
            if check_existing_entry "$hosts_file"; then
                log_success "✅ Entrada para test.precivox.com.br encontrada"
                test_connectivity
            else
                log_warning "⚠️  Entrada para test.precivox.com.br não encontrada"
            fi
            ;;
            
        *)
            echo "Uso: $0 [add|remove|check]"
            echo ""
            echo "Comandos:"
            echo "  add     - Adicionar test.precivox.com.br ao hosts (padrão)"
            echo "  remove  - Remover test.precivox.com.br do hosts"  
            echo "  check   - Verificar se a entrada existe"
            echo ""
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"