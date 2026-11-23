
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "activity_logs": {
                  Row: {
                    "action": string,"actor_id": string | null,"client_id": string | null,"created_at": string,"description": string,"entity_id": string | null,"entity_type": string,"id": string,"is_client_visible": boolean,"metadata": NonNullable<Json>,"organization_id": string,"project_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"client_id"?: string | null,"created_at"?: string,"description": string,"entity_id"?: string | null,"entity_type": string,"id"?: string,"is_client_visible"?: boolean,"metadata"?: NonNullable<Json>,"organization_id": string,"project_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"client_id"?: string | null,"created_at"?: string,"description"?: string,"entity_id"?: string | null,"entity_type"?: string,"id"?: string,"is_client_visible"?: boolean,"metadata"?: NonNullable<Json>,"organization_id"?: string,"project_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_logs_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_logs_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_logs_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_logs_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_logs_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "activity_logs_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_logs_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"client_contacts": {
                  Row: {
                    "client_id": string,"created_at": string,"deleted_at": string | null,"email": string,"full_name": string,"id": string,"invited_at": string | null,"is_primary": boolean,"job_title": string | null,"last_seen_at": string | null,"organization_id": string,"phone": string | null,"portal_access": boolean,"profile_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"created_at"?: string,"deleted_at"?: string | null,"email": string,"full_name": string,"id"?: string,"invited_at"?: string | null,"is_primary"?: boolean,"job_title"?: string | null,"last_seen_at"?: string | null,"organization_id": string,"phone"?: string | null,"portal_access"?: boolean,"profile_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"deleted_at"?: string | null,"email"?: string,"full_name"?: string,"id"?: string,"invited_at"?: string | null,"is_primary"?: boolean,"job_title"?: string | null,"last_seen_at"?: string | null,"organization_id"?: string,"phone"?: string | null,"portal_access"?: boolean,"profile_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "client_contacts_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "client_contacts_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "client_contacts_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "client_contacts_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "client_contacts_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"clients": {
                  Row: {
                    "account_manager_id": string | null,"address_line1": string | null,"address_line2": string | null,"city": string | null,"company_name": string | null,"converted_from_lead_id": string | null,"country": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"email": string | null,"id": string,"industry": string | null,"name": string,"notes": string | null,"organization_id": string,"phone": string | null,"postal_code": string | null,"source": string | null,"state": string | null,"status": Database["public"]['Enums']["client_status"],"tax_id": string | null,"type": Database["public"]['Enums']["client_type"],"updated_at": string,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "account_manager_id"?: string | null,"address_line1"?: string | null,"address_line2"?: string | null,"city"?: string | null,"company_name"?: string | null,"converted_from_lead_id"?: string | null,"country"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"email"?: string | null,"id"?: string,"industry"?: string | null,"name": string,"notes"?: string | null,"organization_id": string,"phone"?: string | null,"postal_code"?: string | null,"source"?: string | null,"state"?: string | null,"status"?: Database["public"]['Enums']["client_status"],"tax_id"?: string | null,"type"?: Database["public"]['Enums']["client_type"],"updated_at"?: string,"website"?: string | null
                  }
                  Update: {
                    "account_manager_id"?: string | null,"address_line1"?: string | null,"address_line2"?: string | null,"city"?: string | null,"company_name"?: string | null,"converted_from_lead_id"?: string | null,"country"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"email"?: string | null,"id"?: string,"industry"?: string | null,"name"?: string,"notes"?: string | null,"organization_id"?: string,"phone"?: string | null,"postal_code"?: string | null,"source"?: string | null,"state"?: string | null,"status"?: Database["public"]['Enums']["client_status"],"tax_id"?: string | null,"type"?: Database["public"]['Enums']["client_type"],"updated_at"?: string,"website"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "clients_account_manager_id_fkey"
      columns: ["account_manager_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "clients_converted_lead_fk"
      columns: ["converted_from_lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "clients_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "clients_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "clients_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    }
                  ]
                },"contract_versions": {
                  Row: {
                    "contract_id": string,"created_at": string,"created_by": string | null,"file_id": string,"id": string,"notes": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "contract_id": string,"created_at"?: string,"created_by"?: string | null,"file_id": string,"id"?: string,"notes"?: string | null,"version": number
                  }
                  Update: {
                    "contract_id"?: string,"created_at"?: string,"created_by"?: string | null,"file_id"?: string,"id"?: string,"notes"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "contract_versions_contract_id_fkey"
      columns: ["contract_id"]
isOneToOne: false
      referencedRelation: "contracts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contract_versions_contract_id_fkey"
      columns: ["contract_id"]
isOneToOne: false
      referencedRelation: "portal_contracts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contract_versions_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contract_versions_file_id_fkey"
      columns: ["file_id"]
isOneToOne: false
      referencedRelation: "files"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contract_versions_file_id_fkey"
      columns: ["file_id"]
isOneToOne: false
      referencedRelation: "portal_files"
      referencedColumns: ["id"]
    }
                  ]
                },"contracts": {
                  Row: {
                    "accepted_at": string | null,"accepted_by": string | null,"client_id": string,"created_at": string,"created_by": string | null,"current_version": number,"deleted_at": string | null,"description": string | null,"end_date": string | null,"id": string,"notes": string | null,"organization_id": string,"project_id": string | null,"proposal_id": string | null,"signed_at": string | null,"signed_by_name": string | null,"start_date": string | null,"status": Database["public"]['Enums']["contract_status"],"title": string,"updated_at": string,"value_cents": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"client_id": string,"created_at"?: string,"created_by"?: string | null,"current_version"?: number,"deleted_at"?: string | null,"description"?: string | null,"end_date"?: string | null,"id"?: string,"notes"?: string | null,"organization_id": string,"project_id"?: string | null,"proposal_id"?: string | null,"signed_at"?: string | null,"signed_by_name"?: string | null,"start_date"?: string | null,"status"?: Database["public"]['Enums']["contract_status"],"title": string,"updated_at"?: string,"value_cents"?: number | null
                  }
                  Update: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"client_id"?: string,"created_at"?: string,"created_by"?: string | null,"current_version"?: number,"deleted_at"?: string | null,"description"?: string | null,"end_date"?: string | null,"id"?: string,"notes"?: string | null,"organization_id"?: string,"project_id"?: string | null,"proposal_id"?: string | null,"signed_at"?: string | null,"signed_by_name"?: string | null,"start_date"?: string | null,"status"?: Database["public"]['Enums']["contract_status"],"title"?: string,"updated_at"?: string,"value_cents"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "contracts_accepted_by_fkey"
      columns: ["accepted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contracts_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contracts_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contracts_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contracts_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contracts_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "contracts_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contracts_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contracts_proposal_id_fkey"
      columns: ["proposal_id"]
isOneToOne: false
      referencedRelation: "portal_proposals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contracts_proposal_id_fkey"
      columns: ["proposal_id"]
isOneToOne: false
      referencedRelation: "proposals"
      referencedColumns: ["id"]
    }
                  ]
                },"conversation_reads": {
                  Row: {
                    "conversation_id": string,"last_read_at": string,"profile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "conversation_id": string,"last_read_at"?: string,"profile_id": string
                  }
                  Update: {
                    "conversation_id"?: string,"last_read_at"?: string,"profile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversation_reads_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversation_reads_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"conversations": {
                  Row: {
                    "client_id": string | null,"created_at": string,"created_by": string | null,"id": string,"is_internal": boolean,"last_message_at": string | null,"organization_id": string,"project_id": string | null,"subject": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"is_internal"?: boolean,"last_message_at"?: string | null,"organization_id": string,"project_id"?: string | null,"subject"?: string,"updated_at"?: string
                  }
                  Update: {
                    "client_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"is_internal"?: boolean,"last_message_at"?: string | null,"organization_id"?: string,"project_id"?: string | null,"subject"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversations_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "conversations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"deliverable_reviews": {
                  Row: {
                    "created_at": string,"decision": Database["public"]['Enums']["review_decision"],"deliverable_id": string,"feedback": string | null,"id": string,"reviewer_id": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"decision": Database["public"]['Enums']["review_decision"],"deliverable_id": string,"feedback"?: string | null,"id"?: string,"reviewer_id"?: string | null,"version": number
                  }
                  Update: {
                    "created_at"?: string,"decision"?: Database["public"]['Enums']["review_decision"],"deliverable_id"?: string,"feedback"?: string | null,"id"?: string,"reviewer_id"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "deliverable_reviews_deliverable_id_fkey"
      columns: ["deliverable_id"]
isOneToOne: false
      referencedRelation: "deliverables"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverable_reviews_deliverable_id_fkey"
      columns: ["deliverable_id"]
isOneToOne: false
      referencedRelation: "portal_deliverables"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverable_reviews_reviewer_id_fkey"
      columns: ["reviewer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"deliverable_versions": {
                  Row: {
                    "created_at": string,"created_by": string | null,"deliverable_id": string,"external_url": string | null,"file_id": string | null,"id": string,"notes": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"deliverable_id": string,"external_url"?: string | null,"file_id"?: string | null,"id"?: string,"notes"?: string | null,"version": number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"deliverable_id"?: string,"external_url"?: string | null,"file_id"?: string | null,"id"?: string,"notes"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "deliverable_versions_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverable_versions_deliverable_id_fkey"
      columns: ["deliverable_id"]
isOneToOne: false
      referencedRelation: "deliverables"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverable_versions_deliverable_id_fkey"
      columns: ["deliverable_id"]
isOneToOne: false
      referencedRelation: "portal_deliverables"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverable_versions_file_id_fkey"
      columns: ["file_id"]
isOneToOne: false
      referencedRelation: "files"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverable_versions_file_id_fkey"
      columns: ["file_id"]
isOneToOne: false
      referencedRelation: "portal_files"
      referencedColumns: ["id"]
    }
                  ]
                },"deliverables": {
                  Row: {
                    "approved_at": string | null,"approved_by": string | null,"created_at": string,"created_by": string | null,"current_version": number,"description": string | null,"due_date": string | null,"id": string,"milestone_id": string | null,"organization_id": string,"project_id": string,"status": Database["public"]['Enums']["deliverable_status"],"submitted_at": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"created_at"?: string,"created_by"?: string | null,"current_version"?: number,"description"?: string | null,"due_date"?: string | null,"id"?: string,"milestone_id"?: string | null,"organization_id": string,"project_id": string,"status"?: Database["public"]['Enums']["deliverable_status"],"submitted_at"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"created_at"?: string,"created_by"?: string | null,"current_version"?: number,"description"?: string | null,"due_date"?: string | null,"id"?: string,"milestone_id"?: string | null,"organization_id"?: string,"project_id"?: string,"status"?: Database["public"]['Enums']["deliverable_status"],"submitted_at"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "deliverables_approved_by_fkey"
      columns: ["approved_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverables_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverables_milestone_id_fkey"
      columns: ["milestone_id"]
isOneToOne: false
      referencedRelation: "milestones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverables_milestone_id_fkey"
      columns: ["milestone_id"]
isOneToOne: false
      referencedRelation: "portal_milestones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverables_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverables_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "deliverables_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverables_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"email_outbox": {
                  Row: {
                    "attempts": number,"created_at": string,"id": string,"idempotency_key": string,"last_error": string | null,"locked_at": string | null,"max_attempts": number,"next_attempt_at": string,"organization_id": string | null,"payload": NonNullable<Json>,"provider": string | null,"provider_message_id": string | null,"sent_at": string | null,"status": Database["public"]['Enums']["email_status"],"template": string,"to_email": string,"to_name": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attempts"?: number,"created_at"?: string,"id"?: string,"idempotency_key": string,"last_error"?: string | null,"locked_at"?: string | null,"max_attempts"?: number,"next_attempt_at"?: string,"organization_id"?: string | null,"payload"?: NonNullable<Json>,"provider"?: string | null,"provider_message_id"?: string | null,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["email_status"],"template": string,"to_email": string,"to_name"?: string | null
                  }
                  Update: {
                    "attempts"?: number,"created_at"?: string,"id"?: string,"idempotency_key"?: string,"last_error"?: string | null,"locked_at"?: string | null,"max_attempts"?: number,"next_attempt_at"?: string,"organization_id"?: string | null,"payload"?: NonNullable<Json>,"provider"?: string | null,"provider_message_id"?: string | null,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["email_status"],"template"?: string,"to_email"?: string,"to_name"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "email_outbox_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "email_outbox_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    }
                  ]
                },"expenses": {
                  Row: {
                    "amount_cents": number,"category": string,"created_at": string,"created_by": string | null,"deleted_at": string | null,"description": string,"expense_date": string,"id": string,"organization_id": string,"project_id": string | null,"receipt_file_id": string | null,"updated_at": string,"vendor": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents": number,"category": string,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description": string,"expense_date"?: string,"id"?: string,"organization_id": string,"project_id"?: string | null,"receipt_file_id"?: string | null,"updated_at"?: string,"vendor"?: string | null
                  }
                  Update: {
                    "amount_cents"?: number,"category"?: string,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string,"expense_date"?: string,"id"?: string,"organization_id"?: string,"project_id"?: string | null,"receipt_file_id"?: string | null,"updated_at"?: string,"vendor"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "expenses_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "expenses_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "expenses_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "expenses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "expenses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "expenses_receipt_file_id_fkey"
      columns: ["receipt_file_id"]
isOneToOne: false
      referencedRelation: "files"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "expenses_receipt_file_id_fkey"
      columns: ["receipt_file_id"]
isOneToOne: false
      referencedRelation: "portal_files"
      referencedColumns: ["id"]
    }
                  ]
                },"faqs": {
                  Row: {
                    "answer": string,"category": string,"created_at": string,"id": string,"is_published": boolean,"organization_id": string,"question": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answer": string,"category"?: string,"created_at"?: string,"id"?: string,"is_published"?: boolean,"organization_id": string,"question": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "answer"?: string,"category"?: string,"created_at"?: string,"id"?: string,"is_published"?: boolean,"organization_id"?: string,"question"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "faqs_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "faqs_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    }
                  ]
                },"files": {
                  Row: {
                    "bucket": string,"category": string,"client_id": string | null,"created_at": string,"deleted_at": string | null,"id": string,"mime_type": string,"name": string,"organization_id": string,"path": string,"project_id": string | null,"size_bytes": number,"task_id": string | null,"uploaded_by": string | null,"visibility": Database["public"]['Enums']["file_visibility"]
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket": string,"category"?: string,"client_id"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"mime_type": string,"name": string,"organization_id": string,"path": string,"project_id"?: string | null,"size_bytes": number,"task_id"?: string | null,"uploaded_by"?: string | null,"visibility"?: Database["public"]['Enums']["file_visibility"]
                  }
                  Update: {
                    "bucket"?: string,"category"?: string,"client_id"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"mime_type"?: string,"name"?: string,"organization_id"?: string,"path"?: string,"project_id"?: string | null,"size_bytes"?: number,"task_id"?: string | null,"uploaded_by"?: string | null,"visibility"?: Database["public"]['Enums']["file_visibility"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "files_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "files_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "files_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "files_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "files_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "files_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "files_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "portal_tasks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "files_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "files_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"invoice_items": {
                  Row: {
                    "amount_cents": number,"description": string,"id": string,"invoice_id": string,"quantity": number,"service_id": string | null,"sort_order": number,"unit_price_cents": number
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents"?: number,"description": string,"id"?: string,"invoice_id": string,"quantity"?: number,"service_id"?: string | null,"sort_order"?: number,"unit_price_cents": number
                  }
                  Update: {
                    "amount_cents"?: number,"description"?: string,"id"?: string,"invoice_id"?: string,"quantity"?: number,"service_id"?: string | null,"sort_order"?: number,"unit_price_cents"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "invoice_items_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
      referencedRelation: "invoices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoice_items_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
      referencedRelation: "portal_invoices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoice_items_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id"]
    }
                  ]
                },"invoices": {
                  Row: {
                    "amount_paid_cents": number,"balance_cents": number | null,"cancelled_at": string | null,"client_id": string,"created_at": string,"created_by": string | null,"currency": string,"deleted_at": string | null,"discount_cents": number,"discount_type": Database["public"]['Enums']["discount_type"],"discount_value": number,"due_date": string,"id": string,"issue_date": string,"notes": string | null,"number": string,"organization_id": string,"paid_at": string | null,"payment_terms": string | null,"project_id": string | null,"proposal_id": string | null,"sent_at": string | null,"status": Database["public"]['Enums']["invoice_status"],"subtotal_cents": number,"tax_cents": number,"tax_rate_bps": number,"total_cents": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_paid_cents"?: number,"balance_cents"?: never,"cancelled_at"?: string | null,"client_id": string,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"deleted_at"?: string | null,"discount_cents"?: number,"discount_type"?: Database["public"]['Enums']["discount_type"],"discount_value"?: number,"due_date": string,"id"?: string,"issue_date"?: string,"notes"?: string | null,"number": string,"organization_id": string,"paid_at"?: string | null,"payment_terms"?: string | null,"project_id"?: string | null,"proposal_id"?: string | null,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["invoice_status"],"subtotal_cents"?: number,"tax_cents"?: number,"tax_rate_bps"?: number,"total_cents"?: number,"updated_at"?: string
                  }
                  Update: {
                    "amount_paid_cents"?: number,"balance_cents"?: never,"cancelled_at"?: string | null,"client_id"?: string,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"deleted_at"?: string | null,"discount_cents"?: number,"discount_type"?: Database["public"]['Enums']["discount_type"],"discount_value"?: number,"due_date"?: string,"id"?: string,"issue_date"?: string,"notes"?: string | null,"number"?: string,"organization_id"?: string,"paid_at"?: string | null,"payment_terms"?: string | null,"project_id"?: string | null,"proposal_id"?: string | null,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["invoice_status"],"subtotal_cents"?: number,"tax_cents"?: number,"tax_rate_bps"?: number,"total_cents"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invoices_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_proposal_id_fkey"
      columns: ["proposal_id"]
isOneToOne: false
      referencedRelation: "portal_proposals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_proposal_id_fkey"
      columns: ["proposal_id"]
isOneToOne: false
      referencedRelation: "proposals"
      referencedColumns: ["id"]
    }
                  ]
                },"lead_activities": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"description": string,"id": string,"lead_id": string,"metadata": NonNullable<Json>,"organization_id": string,"type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"description": string,"id"?: string,"lead_id": string,"metadata"?: NonNullable<Json>,"organization_id": string,"type": string
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"description"?: string,"id"?: string,"lead_id"?: string,"metadata"?: NonNullable<Json>,"organization_id"?: string,"type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lead_activities_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lead_activities_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lead_activities_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lead_activities_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    }
                  ]
                },"lead_notes": {
                  Row: {
                    "author_id": string | null,"body": string,"created_at": string,"id": string,"lead_id": string,"organization_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"created_at"?: string,"id"?: string,"lead_id": string,"organization_id": string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"created_at"?: string,"id"?: string,"lead_id"?: string,"organization_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lead_notes_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lead_notes_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lead_notes_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lead_notes_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    }
                  ]
                },"leads": {
                  Row: {
                    "assigned_to": string | null,"budget_cents": number | null,"budget_range": string | null,"company": string | null,"converted_at": string | null,"converted_client_id": string | null,"country": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"description": string | null,"desired_start_date": string | null,"email": string,"follow_up_at": string | null,"full_name": string,"id": string,"industry": string | null,"internal_notes": string | null,"lost_reason": string | null,"metadata": NonNullable<Json>,"organization_id": string,"phone": string | null,"priority": Database["public"]['Enums']["priority_level"],"qualification": NonNullable<Json>,"qualification_score": number | null,"requested_service": string | null,"service_id": string | null,"source": string,"status": Database["public"]['Enums']["lead_status"],"timeline": string | null,"updated_at": string,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_to"?: string | null,"budget_cents"?: number | null,"budget_range"?: string | null,"company"?: string | null,"converted_at"?: string | null,"converted_client_id"?: string | null,"country"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string | null,"desired_start_date"?: string | null,"email": string,"follow_up_at"?: string | null,"full_name": string,"id"?: string,"industry"?: string | null,"internal_notes"?: string | null,"lost_reason"?: string | null,"metadata"?: NonNullable<Json>,"organization_id": string,"phone"?: string | null,"priority"?: Database["public"]['Enums']["priority_level"],"qualification"?: NonNullable<Json>,"qualification_score"?: number | null,"requested_service"?: string | null,"service_id"?: string | null,"source"?: string,"status"?: Database["public"]['Enums']["lead_status"],"timeline"?: string | null,"updated_at"?: string,"website"?: string | null
                  }
                  Update: {
                    "assigned_to"?: string | null,"budget_cents"?: number | null,"budget_range"?: string | null,"company"?: string | null,"converted_at"?: string | null,"converted_client_id"?: string | null,"country"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string | null,"desired_start_date"?: string | null,"email"?: string,"follow_up_at"?: string | null,"full_name"?: string,"id"?: string,"industry"?: string | null,"internal_notes"?: string | null,"lost_reason"?: string | null,"metadata"?: NonNullable<Json>,"organization_id"?: string,"phone"?: string | null,"priority"?: Database["public"]['Enums']["priority_level"],"qualification"?: NonNullable<Json>,"qualification_score"?: number | null,"requested_service"?: string | null,"service_id"?: string | null,"source"?: string,"status"?: Database["public"]['Enums']["lead_status"],"timeline"?: string | null,"updated_at"?: string,"website"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "leads_assigned_to_fkey"
      columns: ["assigned_to"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_converted_client_id_fkey"
      columns: ["converted_client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_converted_client_id_fkey"
      columns: ["converted_client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "leads_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id"]
    }
                  ]
                },"meeting_records": {
                  Row: {
                    "agenda": string | null,"client_id": string | null,"created_at": string,"created_by": string | null,"duration_minutes": number | null,"id": string,"lead_id": string | null,"location": string | null,"meeting_url": string | null,"notes": string | null,"organization_id": string,"project_id": string | null,"scheduled_at": string | null,"source": string,"status": Database["public"]['Enums']["meeting_status"],"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "agenda"?: string | null,"client_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"duration_minutes"?: number | null,"id"?: string,"lead_id"?: string | null,"location"?: string | null,"meeting_url"?: string | null,"notes"?: string | null,"organization_id": string,"project_id"?: string | null,"scheduled_at"?: string | null,"source"?: string,"status"?: Database["public"]['Enums']["meeting_status"],"title": string,"updated_at"?: string
                  }
                  Update: {
                    "agenda"?: string | null,"client_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"duration_minutes"?: number | null,"id"?: string,"lead_id"?: string | null,"location"?: string | null,"meeting_url"?: string | null,"notes"?: string | null,"organization_id"?: string,"project_id"?: string | null,"scheduled_at"?: string | null,"source"?: string,"status"?: Database["public"]['Enums']["meeting_status"],"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "meeting_records_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "meeting_records_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "meeting_records_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "meeting_records_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "meeting_records_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "meeting_records_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "meeting_records_project_fk"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "meeting_records_project_fk"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"message_attachments": {
                  Row: {
                    "file_id": string,"message_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "file_id": string,"message_id": string
                  }
                  Update: {
                    "file_id"?: string,"message_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "message_attachments_file_id_fkey"
      columns: ["file_id"]
isOneToOne: false
      referencedRelation: "files"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "message_attachments_file_id_fkey"
      columns: ["file_id"]
isOneToOne: false
      referencedRelation: "portal_files"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "message_attachments_message_id_fkey"
      columns: ["message_id"]
isOneToOne: false
      referencedRelation: "messages"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "author_id": string | null,"body": string,"conversation_id": string,"created_at": string,"edited_at": string | null,"id": string,"organization_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"conversation_id": string,"created_at"?: string,"edited_at"?: string | null,"id"?: string,"organization_id": string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"conversation_id"?: string,"created_at"?: string,"edited_at"?: string | null,"id"?: string,"organization_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    }
                  ]
                },"milestones": {
                  Row: {
                    "completed_at": string | null,"created_at": string,"description": string | null,"due_date": string | null,"id": string,"is_client_visible": boolean,"organization_id": string,"project_id": string,"sort_order": number,"start_date": string | null,"status": Database["public"]['Enums']["milestone_status"],"title": string,"updated_at": string,"weight": number
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string | null,"created_at"?: string,"description"?: string | null,"due_date"?: string | null,"id"?: string,"is_client_visible"?: boolean,"organization_id": string,"project_id": string,"sort_order"?: number,"start_date"?: string | null,"status"?: Database["public"]['Enums']["milestone_status"],"title": string,"updated_at"?: string,"weight"?: number
                  }
                  Update: {
                    "completed_at"?: string | null,"created_at"?: string,"description"?: string | null,"due_date"?: string | null,"id"?: string,"is_client_visible"?: boolean,"organization_id"?: string,"project_id"?: string,"sort_order"?: number,"start_date"?: string | null,"status"?: Database["public"]['Enums']["milestone_status"],"title"?: string,"updated_at"?: string,"weight"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "milestones_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "milestones_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "milestones_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "milestones_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"notification_preferences": {
                  Row: {
                    "email_enabled": boolean,"email_types": NonNullable<Json>,"profile_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "email_enabled"?: boolean,"email_types"?: NonNullable<Json>,"profile_id": string,"updated_at"?: string
                  }
                  Update: {
                    "email_enabled"?: boolean,"email_types"?: NonNullable<Json>,"profile_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notification_preferences_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string | null,"created_at": string,"dedupe_key": string | null,"entity_id": string | null,"entity_type": string | null,"id": string,"link": string | null,"organization_id": string | null,"read_at": string | null,"recipient_id": string,"title": string,"type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"dedupe_key"?: string | null,"entity_id"?: string | null,"entity_type"?: string | null,"id"?: string,"link"?: string | null,"organization_id"?: string | null,"read_at"?: string | null,"recipient_id": string,"title": string,"type": string
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"dedupe_key"?: string | null,"entity_id"?: string | null,"entity_type"?: string | null,"id"?: string,"link"?: string | null,"organization_id"?: string | null,"read_at"?: string | null,"recipient_id"?: string,"title"?: string,"type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "notifications_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"slug": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"slug": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"slug"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"payments": {
                  Row: {
                    "amount_cents": number,"client_id": string,"created_at": string,"id": string,"idempotency_key": string | null,"invoice_id": string,"method": Database["public"]['Enums']["payment_method"],"notes": string | null,"organization_id": string,"payment_date": string,"project_id": string | null,"provider": string,"provider_payment_id": string | null,"recorded_by": string | null,"reference": string | null,"status": Database["public"]['Enums']["payment_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents": number,"client_id": string,"created_at"?: string,"id"?: string,"idempotency_key"?: string | null,"invoice_id": string,"method"?: Database["public"]['Enums']["payment_method"],"notes"?: string | null,"organization_id": string,"payment_date"?: string,"project_id"?: string | null,"provider"?: string,"provider_payment_id"?: string | null,"recorded_by"?: string | null,"reference"?: string | null,"status"?: Database["public"]['Enums']["payment_status"],"updated_at"?: string
                  }
                  Update: {
                    "amount_cents"?: number,"client_id"?: string,"created_at"?: string,"id"?: string,"idempotency_key"?: string | null,"invoice_id"?: string,"method"?: Database["public"]['Enums']["payment_method"],"notes"?: string | null,"organization_id"?: string,"payment_date"?: string,"project_id"?: string | null,"provider"?: string,"provider_payment_id"?: string | null,"recorded_by"?: string | null,"reference"?: string | null,"status"?: Database["public"]['Enums']["payment_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
      referencedRelation: "invoices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
      referencedRelation: "portal_invoices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "payments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_recorded_by_fkey"
      columns: ["recorded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"permissions": {
                  Row: {
                    "description": string,"key": string,"module": string
                  }
                  ComputedFields: never
                  Insert: {
                    "description": string,"key": string,"module": string
                  }
                  Update: {
                    "description"?: string,"key"?: string,"module"?: string
                  }
                  Relationships: [
                    
                  ]
                },"portfolio_items": {
                  Row: {
                    "challenge": string | null,"client_name": string | null,"cover_image_url": string | null,"created_at": string,"id": string,"industry": string | null,"is_featured": boolean,"is_published": boolean,"metrics": NonNullable<Json>,"organization_id": string,"project_url": string | null,"results": string | null,"services": (string)[],"slug": string,"solution": string | null,"sort_order": number,"summary": string | null,"tech_stack": (string)[],"title": string,"updated_at": string,"year": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "challenge"?: string | null,"client_name"?: string | null,"cover_image_url"?: string | null,"created_at"?: string,"id"?: string,"industry"?: string | null,"is_featured"?: boolean,"is_published"?: boolean,"metrics"?: NonNullable<Json>,"organization_id": string,"project_url"?: string | null,"results"?: string | null,"services"?: (string)[],"slug": string,"solution"?: string | null,"sort_order"?: number,"summary"?: string | null,"tech_stack"?: (string)[],"title": string,"updated_at"?: string,"year"?: number | null
                  }
                  Update: {
                    "challenge"?: string | null,"client_name"?: string | null,"cover_image_url"?: string | null,"created_at"?: string,"id"?: string,"industry"?: string | null,"is_featured"?: boolean,"is_published"?: boolean,"metrics"?: NonNullable<Json>,"organization_id"?: string,"project_url"?: string | null,"results"?: string | null,"services"?: (string)[],"slug"?: string,"solution"?: string | null,"sort_order"?: number,"summary"?: string | null,"tech_stack"?: (string)[],"title"?: string,"updated_at"?: string,"year"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "portfolio_items_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "portfolio_items_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"email": string,"full_name": string | null,"id": string,"job_title": string | null,"phone": string | null,"timezone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"email": string,"full_name"?: string | null,"id": string,"job_title"?: string | null,"phone"?: string | null,"timezone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"email"?: string,"full_name"?: string | null,"id"?: string,"job_title"?: string | null,"phone"?: string | null,"timezone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"project_finances": {
                  Row: {
                    "budget_cents": number | null,"contract_value_cents": number | null,"organization_id": string,"project_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "budget_cents"?: number | null,"contract_value_cents"?: number | null,"organization_id": string,"project_id": string,"updated_at"?: string
                  }
                  Update: {
                    "budget_cents"?: number | null,"contract_value_cents"?: number | null,"organization_id"?: string,"project_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_finances_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_finances_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "project_finances_project_id_fkey"
      columns: ["project_id"]
isOneToOne: true
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_finances_project_id_fkey"
      columns: ["project_id"]
isOneToOne: true
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_members": {
                  Row: {
                    "added_at": string,"added_by": string | null,"profile_id": string,"project_id": string,"role": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "added_at"?: string,"added_by"?: string | null,"profile_id": string,"project_id": string,"role"?: string | null
                  }
                  Update: {
                    "added_at"?: string,"added_by"?: string | null,"profile_id"?: string,"project_id"?: string,"role"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_members_added_by_fkey"
      columns: ["added_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_members_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_members_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_members_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_template_milestones": {
                  Row: {
                    "description": string | null,"duration_days": number,"id": string,"is_client_visible": boolean,"offset_days": number,"sort_order": number,"template_id": string,"title": string,"weight": number
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"duration_days"?: number,"id"?: string,"is_client_visible"?: boolean,"offset_days"?: number,"sort_order"?: number,"template_id": string,"title": string,"weight"?: number
                  }
                  Update: {
                    "description"?: string | null,"duration_days"?: number,"id"?: string,"is_client_visible"?: boolean,"offset_days"?: number,"sort_order"?: number,"template_id"?: string,"title"?: string,"weight"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_template_milestones_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "project_templates"
      referencedColumns: ["id"]
    }
                  ]
                },"project_template_tasks": {
                  Row: {
                    "default_role": string | null,"description": string | null,"estimated_hours": number | null,"id": string,"is_client_visible": boolean,"milestone_id": string | null,"offset_days": number,"requires_client_action": boolean,"sort_order": number,"template_id": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "default_role"?: string | null,"description"?: string | null,"estimated_hours"?: number | null,"id"?: string,"is_client_visible"?: boolean,"milestone_id"?: string | null,"offset_days"?: number,"requires_client_action"?: boolean,"sort_order"?: number,"template_id": string,"title": string
                  }
                  Update: {
                    "default_role"?: string | null,"description"?: string | null,"estimated_hours"?: number | null,"id"?: string,"is_client_visible"?: boolean,"milestone_id"?: string | null,"offset_days"?: number,"requires_client_action"?: boolean,"sort_order"?: number,"template_id"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_template_tasks_default_role_fkey"
      columns: ["default_role"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["key"]
    },{
      foreignKeyName: "project_template_tasks_milestone_id_fkey"
      columns: ["milestone_id"]
isOneToOne: false
      referencedRelation: "project_template_milestones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_template_tasks_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "project_templates"
      referencedColumns: ["id"]
    }
                  ]
                },"project_templates": {
                  Row: {
                    "created_at": string,"created_by": string | null,"description": string | null,"id": string,"is_active": boolean,"name": string,"organization_id": string,"service_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"organization_id": string,"service_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"organization_id"?: string,"service_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_templates_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_templates_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_templates_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "project_templates_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id"]
    }
                  ]
                },"projects": {
                  Row: {
                    "client_id": string,"code": string,"completed_at": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"description": string | null,"due_date": string | null,"id": string,"internal_notes": string | null,"lead_id": string | null,"name": string,"organization_id": string,"priority": Database["public"]['Enums']["priority_level"],"progress": number,"progress_mode": string,"project_manager_id": string | null,"proposal_id": string | null,"review_requested_at": string | null,"scope": string | null,"service_id": string | null,"start_date": string | null,"status": Database["public"]['Enums']["project_status"],"template_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"code": string,"completed_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string | null,"due_date"?: string | null,"id"?: string,"internal_notes"?: string | null,"lead_id"?: string | null,"name": string,"organization_id": string,"priority"?: Database["public"]['Enums']["priority_level"],"progress"?: number,"progress_mode"?: string,"project_manager_id"?: string | null,"proposal_id"?: string | null,"review_requested_at"?: string | null,"scope"?: string | null,"service_id"?: string | null,"start_date"?: string | null,"status"?: Database["public"]['Enums']["project_status"],"template_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "client_id"?: string,"code"?: string,"completed_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string | null,"due_date"?: string | null,"id"?: string,"internal_notes"?: string | null,"lead_id"?: string | null,"name"?: string,"organization_id"?: string,"priority"?: Database["public"]['Enums']["priority_level"],"progress"?: number,"progress_mode"?: string,"project_manager_id"?: string | null,"proposal_id"?: string | null,"review_requested_at"?: string | null,"scope"?: string | null,"service_id"?: string | null,"start_date"?: string | null,"status"?: Database["public"]['Enums']["project_status"],"template_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "projects_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "projects_project_manager_id_fkey"
      columns: ["project_manager_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_proposal_fk"
      columns: ["proposal_id"]
isOneToOne: false
      referencedRelation: "portal_proposals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_proposal_fk"
      columns: ["proposal_id"]
isOneToOne: false
      referencedRelation: "proposals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "project_templates"
      referencedColumns: ["id"]
    }
                  ]
                },"proposal_items": {
                  Row: {
                    "amount_cents": number,"description": string,"details": string | null,"id": string,"proposal_id": string,"quantity": number,"service_id": string | null,"sort_order": number,"unit_price_cents": number
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents"?: number,"description": string,"details"?: string | null,"id"?: string,"proposal_id": string,"quantity"?: number,"service_id"?: string | null,"sort_order"?: number,"unit_price_cents": number
                  }
                  Update: {
                    "amount_cents"?: number,"description"?: string,"details"?: string | null,"id"?: string,"proposal_id"?: string,"quantity"?: number,"service_id"?: string | null,"sort_order"?: number,"unit_price_cents"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "proposal_items_proposal_id_fkey"
      columns: ["proposal_id"]
isOneToOne: false
      referencedRelation: "portal_proposals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proposal_items_proposal_id_fkey"
      columns: ["proposal_id"]
isOneToOne: false
      referencedRelation: "proposals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proposal_items_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id"]
    }
                  ]
                },"proposals": {
                  Row: {
                    "client_id": string | null,"client_response_note": string | null,"created_at": string,"created_by": string | null,"currency": string,"deleted_at": string | null,"discount_cents": number,"discount_type": Database["public"]['Enums']["discount_type"],"discount_value": number,"id": string,"lead_id": string | null,"number": string,"organization_id": string,"payment_terms": string | null,"project_id": string | null,"responded_at": string | null,"responded_by": string | null,"scope": string | null,"sent_at": string | null,"status": Database["public"]['Enums']["proposal_status"],"subtotal_cents": number,"summary": string | null,"tax_cents": number,"tax_rate_bps": number,"timeline": string | null,"title": string,"total_cents": number,"updated_at": string,"valid_until": string | null,"viewed_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id"?: string | null,"client_response_note"?: string | null,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"deleted_at"?: string | null,"discount_cents"?: number,"discount_type"?: Database["public"]['Enums']["discount_type"],"discount_value"?: number,"id"?: string,"lead_id"?: string | null,"number": string,"organization_id": string,"payment_terms"?: string | null,"project_id"?: string | null,"responded_at"?: string | null,"responded_by"?: string | null,"scope"?: string | null,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["proposal_status"],"subtotal_cents"?: number,"summary"?: string | null,"tax_cents"?: number,"tax_rate_bps"?: number,"timeline"?: string | null,"title": string,"total_cents"?: number,"updated_at"?: string,"valid_until"?: string | null,"viewed_at"?: string | null
                  }
                  Update: {
                    "client_id"?: string | null,"client_response_note"?: string | null,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"deleted_at"?: string | null,"discount_cents"?: number,"discount_type"?: Database["public"]['Enums']["discount_type"],"discount_value"?: number,"id"?: string,"lead_id"?: string | null,"number"?: string,"organization_id"?: string,"payment_terms"?: string | null,"project_id"?: string | null,"responded_at"?: string | null,"responded_by"?: string | null,"scope"?: string | null,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["proposal_status"],"subtotal_cents"?: number,"summary"?: string | null,"tax_cents"?: number,"tax_rate_bps"?: number,"timeline"?: string | null,"title"?: string,"total_cents"?: number,"updated_at"?: string,"valid_until"?: string | null,"viewed_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "proposals_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proposals_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proposals_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proposals_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proposals_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proposals_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "proposals_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proposals_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proposals_responded_by_fkey"
      columns: ["responded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"revisions": {
                  Row: {
                    "created_at": string,"deliverable_id": string | null,"description": string,"id": string,"organization_id": string,"project_id": string,"requested_by": string | null,"resolved_at": string | null,"resolved_by": string | null,"review_id": string | null,"status": Database["public"]['Enums']["revision_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"deliverable_id"?: string | null,"description": string,"id"?: string,"organization_id": string,"project_id": string,"requested_by"?: string | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"review_id"?: string | null,"status"?: Database["public"]['Enums']["revision_status"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"deliverable_id"?: string | null,"description"?: string,"id"?: string,"organization_id"?: string,"project_id"?: string,"requested_by"?: string | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"review_id"?: string | null,"status"?: Database["public"]['Enums']["revision_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "revisions_deliverable_id_fkey"
      columns: ["deliverable_id"]
isOneToOne: false
      referencedRelation: "deliverables"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "revisions_deliverable_id_fkey"
      columns: ["deliverable_id"]
isOneToOne: false
      referencedRelation: "portal_deliverables"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "revisions_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "revisions_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "revisions_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "revisions_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "revisions_requested_by_fkey"
      columns: ["requested_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "revisions_resolved_by_fkey"
      columns: ["resolved_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "revisions_review_id_fkey"
      columns: ["review_id"]
isOneToOne: false
      referencedRelation: "deliverable_reviews"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "revisions_review_id_fkey"
      columns: ["review_id"]
isOneToOne: false
      referencedRelation: "portal_deliverable_reviews"
      referencedColumns: ["id"]
    }
                  ]
                },"role_permissions": {
                  Row: {
                    "permission_key": string,"role_key": string
                  }
                  ComputedFields: never
                  Insert: {
                    "permission_key": string,"role_key": string
                  }
                  Update: {
                    "permission_key"?: string,"role_key"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "role_permissions_permission_key_fkey"
      columns: ["permission_key"]
isOneToOne: false
      referencedRelation: "permissions"
      referencedColumns: ["key"]
    },{
      foreignKeyName: "role_permissions_role_key_fkey"
      columns: ["role_key"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["key"]
    }
                  ]
                },"roles": {
                  Row: {
                    "description": string | null,"is_team_role": boolean,"key": string,"name": string,"rank": number
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"is_team_role"?: boolean,"key": string,"name": string,"rank"?: number
                  }
                  Update: {
                    "description"?: string | null,"is_team_role"?: boolean,"key"?: string,"name"?: string,"rank"?: number
                  }
                  Relationships: [
                    
                  ]
                },"services": {
                  Row: {
                    "category": string,"created_at": string,"deliverables": (string)[],"delivery_time": string | null,"description": string | null,"features": (string)[],"icon": string | null,"id": string,"is_active": boolean,"is_public": boolean,"name": string,"organization_id": string,"slug": string,"sort_order": number,"starting_price_cents": number | null,"summary": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category"?: string,"created_at"?: string,"deliverables"?: (string)[],"delivery_time"?: string | null,"description"?: string | null,"features"?: (string)[],"icon"?: string | null,"id"?: string,"is_active"?: boolean,"is_public"?: boolean,"name": string,"organization_id": string,"slug": string,"sort_order"?: number,"starting_price_cents"?: number | null,"summary"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "category"?: string,"created_at"?: string,"deliverables"?: (string)[],"delivery_time"?: string | null,"description"?: string | null,"features"?: (string)[],"icon"?: string | null,"id"?: string,"is_active"?: boolean,"is_public"?: boolean,"name"?: string,"organization_id"?: string,"slug"?: string,"sort_order"?: number,"starting_price_cents"?: number | null,"summary"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "services_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "services_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    }
                  ]
                },"settings": {
                  Row: {
                    "company_address": string | null,"company_email": string | null,"company_legal_name": string | null,"company_phone": string | null,"currency": string,"default_payment_terms_days": number,"default_tax_rate_bps": number,"invoice_footer": string | null,"invoice_prefix": string,"lead_capacity_projects": number,"next_invoice_number": number,"next_project_number": number,"next_proposal_number": number,"organization_id": string,"payment_instructions": string | null,"project_prefix": string,"proposal_prefix": string,"tax_id": string | null,"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_address"?: string | null,"company_email"?: string | null,"company_legal_name"?: string | null,"company_phone"?: string | null,"currency"?: string,"default_payment_terms_days"?: number,"default_tax_rate_bps"?: number,"invoice_footer"?: string | null,"invoice_prefix"?: string,"lead_capacity_projects"?: number,"next_invoice_number"?: number,"next_project_number"?: number,"next_proposal_number"?: number,"organization_id": string,"payment_instructions"?: string | null,"project_prefix"?: string,"proposal_prefix"?: string,"tax_id"?: string | null,"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "company_address"?: string | null,"company_email"?: string | null,"company_legal_name"?: string | null,"company_phone"?: string | null,"currency"?: string,"default_payment_terms_days"?: number,"default_tax_rate_bps"?: number,"invoice_footer"?: string | null,"invoice_prefix"?: string,"lead_capacity_projects"?: number,"next_invoice_number"?: number,"next_project_number"?: number,"next_proposal_number"?: number,"organization_id"?: string,"payment_instructions"?: string | null,"project_prefix"?: string,"proposal_prefix"?: string,"tax_id"?: string | null,"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "settings_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: true
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "settings_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: true
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    }
                  ]
                },"task_comments": {
                  Row: {
                    "author_id": string | null,"body": string,"created_at": string,"id": string,"organization_id": string,"task_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"created_at"?: string,"id"?: string,"organization_id": string,"task_id": string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"created_at"?: string,"id"?: string,"organization_id"?: string,"task_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "task_comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "task_comments_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "task_comments_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "task_comments_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "portal_tasks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "task_comments_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    }
                  ]
                },"tasks": {
                  Row: {
                    "assignee_id": string | null,"completed_at": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"description": string | null,"due_date": string | null,"estimated_hours": number | null,"id": string,"is_client_visible": boolean,"milestone_id": string | null,"organization_id": string,"parent_task_id": string | null,"priority": Database["public"]['Enums']["priority_level"],"project_id": string,"requires_client_action": boolean,"sort_order": number,"start_date": string | null,"status": Database["public"]['Enums']["task_status"],"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assignee_id"?: string | null,"completed_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string | null,"due_date"?: string | null,"estimated_hours"?: number | null,"id"?: string,"is_client_visible"?: boolean,"milestone_id"?: string | null,"organization_id": string,"parent_task_id"?: string | null,"priority"?: Database["public"]['Enums']["priority_level"],"project_id": string,"requires_client_action"?: boolean,"sort_order"?: number,"start_date"?: string | null,"status"?: Database["public"]['Enums']["task_status"],"title": string,"updated_at"?: string
                  }
                  Update: {
                    "assignee_id"?: string | null,"completed_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string | null,"due_date"?: string | null,"estimated_hours"?: number | null,"id"?: string,"is_client_visible"?: boolean,"milestone_id"?: string | null,"organization_id"?: string,"parent_task_id"?: string | null,"priority"?: Database["public"]['Enums']["priority_level"],"project_id"?: string,"requires_client_action"?: boolean,"sort_order"?: number,"start_date"?: string | null,"status"?: Database["public"]['Enums']["task_status"],"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tasks_assignee_id_fkey"
      columns: ["assignee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_milestone_id_fkey"
      columns: ["milestone_id"]
isOneToOne: false
      referencedRelation: "milestones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_milestone_id_fkey"
      columns: ["milestone_id"]
isOneToOne: false
      referencedRelation: "portal_milestones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "tasks_parent_task_id_fkey"
      columns: ["parent_task_id"]
isOneToOne: false
      referencedRelation: "portal_tasks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_parent_task_id_fkey"
      columns: ["parent_task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"team_members": {
                  Row: {
                    "capacity_hours_per_week": number,"created_at": string,"hourly_cost_cents": number | null,"id": string,"invited_at": string | null,"invited_by": string | null,"joined_at": string | null,"organization_id": string,"profile_id": string,"role_key": string,"status": Database["public"]['Enums']["member_status"],"title": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "capacity_hours_per_week"?: number,"created_at"?: string,"hourly_cost_cents"?: number | null,"id"?: string,"invited_at"?: string | null,"invited_by"?: string | null,"joined_at"?: string | null,"organization_id": string,"profile_id": string,"role_key": string,"status"?: Database["public"]['Enums']["member_status"],"title"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "capacity_hours_per_week"?: number,"created_at"?: string,"hourly_cost_cents"?: number | null,"id"?: string,"invited_at"?: string | null,"invited_by"?: string | null,"joined_at"?: string | null,"organization_id"?: string,"profile_id"?: string,"role_key"?: string,"status"?: Database["public"]['Enums']["member_status"],"title"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "team_members_invited_by_fkey"
      columns: ["invited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "team_members_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "team_members_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "team_members_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "team_members_role_key_fkey"
      columns: ["role_key"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["key"]
    }
                  ]
                },"testimonials": {
                  Row: {
                    "author_name": string,"author_title": string | null,"client_id": string | null,"company": string | null,"created_at": string,"id": string,"is_published": boolean,"organization_id": string,"quote": string,"rating": number | null,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_name": string,"author_title"?: string | null,"client_id"?: string | null,"company"?: string | null,"created_at"?: string,"id"?: string,"is_published"?: boolean,"organization_id": string,"quote": string,"rating"?: number | null,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "author_name"?: string,"author_title"?: string | null,"client_id"?: string | null,"company"?: string | null,"created_at"?: string,"id"?: string,"is_published"?: boolean,"organization_id"?: string,"quote"?: string,"rating"?: number | null,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "testimonials_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "testimonials_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "testimonials_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "testimonials_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    }
                  ]
                },"time_entries": {
                  Row: {
                    "billable": boolean,"created_at": string,"description": string | null,"entry_date": string,"id": string,"minutes": number,"organization_id": string,"profile_id": string,"project_id": string,"task_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "billable"?: boolean,"created_at"?: string,"description"?: string | null,"entry_date"?: string,"id"?: string,"minutes": number,"organization_id": string,"profile_id": string,"project_id": string,"task_id"?: string | null
                  }
                  Update: {
                    "billable"?: boolean,"created_at"?: string,"description"?: string | null,"entry_date"?: string,"id"?: string,"minutes"?: number,"organization_id"?: string,"profile_id"?: string,"project_id"?: string,"task_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "time_entries_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "time_entries_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "time_entries_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "time_entries_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "time_entries_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "time_entries_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "portal_tasks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "time_entries_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "portal_activity": {
                  Row: {
                    "action": string,"client_id": string | null,"created_at": string,"description": string,"entity_id": string | null,"entity_type": string,"id": string,"project_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "action"?: string | null,"client_id"?: string | null,"created_at"?: string | null,"description"?: string | null,"entity_id"?: string | null,"entity_type"?: string | null,"id"?: string | null,"project_id"?: string | null
                         }
                        Update: {
                           "action"?: string | null,"client_id"?: string | null,"created_at"?: string | null,"description"?: string | null,"entity_id"?: string | null,"entity_type"?: string | null,"id"?: string | null,"project_id"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "activity_logs_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_logs_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_logs_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_logs_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"portal_agency": {
                  Row: {
                    "company_address": string | null,"company_email": string | null,"company_legal_name": string | null,"company_phone": string | null,"currency": string,"name": string,"organization_id": string,"payment_instructions": string | null,"tax_id": string | null,"timezone": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"portal_clients": {
                  Row: {
                    "address_line1": string | null,"address_line2": string | null,"city": string | null,"company_name": string | null,"country": string | null,"created_at": string,"email": string | null,"id": string,"industry": string | null,"name": string,"organization_id": string,"phone": string | null,"postal_code": string | null,"state": string | null,"status": Database["public"]['Enums']["client_status"],"tax_id": string | null,"type": Database["public"]['Enums']["client_type"],"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "address_line1"?: string | null,"address_line2"?: string | null,"city"?: string | null,"company_name"?: string | null,"country"?: string | null,"created_at"?: string | null,"email"?: string | null,"id"?: string | null,"industry"?: string | null,"name"?: string | null,"organization_id"?: string | null,"phone"?: string | null,"postal_code"?: string | null,"state"?: string | null,"status"?: Database["public"]['Enums']["client_status"] | null,"tax_id"?: string | null,"type"?: Database["public"]['Enums']["client_type"] | null,"website"?: string | null
                         }
                        Update: {
                           "address_line1"?: string | null,"address_line2"?: string | null,"city"?: string | null,"company_name"?: string | null,"country"?: string | null,"created_at"?: string | null,"email"?: string | null,"id"?: string | null,"industry"?: string | null,"name"?: string | null,"organization_id"?: string | null,"phone"?: string | null,"postal_code"?: string | null,"state"?: string | null,"status"?: Database["public"]['Enums']["client_status"] | null,"tax_id"?: string | null,"type"?: Database["public"]['Enums']["client_type"] | null,"website"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "clients_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "clients_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    }
                  ]
                },"portal_contracts": {
                  Row: {
                    "accepted_at": string | null,"client_id": string,"created_at": string,"current_version": number,"description": string | null,"end_date": string | null,"id": string,"latest_file_id": string | null,"project_id": string | null,"signed_at": string | null,"start_date": string | null,"status": Database["public"]['Enums']["contract_status"],"title": string,"value_cents": number | null
                  }
                  ComputedFields: never
                  Insert: {
                           "accepted_at"?: string | null,"client_id"?: string | null,"created_at"?: string | null,"current_version"?: number | null,"description"?: string | null,"end_date"?: string | null,"id"?: string | null,"latest_file_id"?: never,"project_id"?: string | null,"signed_at"?: string | null,"start_date"?: string | null,"status"?: Database["public"]['Enums']["contract_status"] | null,"title"?: string | null,"value_cents"?: number | null
                         }
                        Update: {
                           "accepted_at"?: string | null,"client_id"?: string | null,"created_at"?: string | null,"current_version"?: number | null,"description"?: string | null,"end_date"?: string | null,"id"?: string | null,"latest_file_id"?: never,"project_id"?: string | null,"signed_at"?: string | null,"start_date"?: string | null,"status"?: Database["public"]['Enums']["contract_status"] | null,"title"?: string | null,"value_cents"?: number | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "contracts_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contracts_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contracts_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contracts_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"portal_deliverable_reviews": {
                  Row: {
                    "created_at": string,"decision": Database["public"]['Enums']["review_decision"],"deliverable_id": string,"feedback": string | null,"id": string,"reviewer_name": string | null,"version": number
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "deliverable_reviews_deliverable_id_fkey"
      columns: ["deliverable_id"]
isOneToOne: false
      referencedRelation: "deliverables"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverable_reviews_deliverable_id_fkey"
      columns: ["deliverable_id"]
isOneToOne: false
      referencedRelation: "portal_deliverables"
      referencedColumns: ["id"]
    }
                  ]
                },"portal_deliverable_versions": {
                  Row: {
                    "created_at": string,"deliverable_id": string,"external_url": string | null,"file_id": string | null,"file_name": string | null,"id": string,"mime_type": string | null,"notes": string | null,"size_bytes": number | null,"version": number
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "deliverable_versions_deliverable_id_fkey"
      columns: ["deliverable_id"]
isOneToOne: false
      referencedRelation: "deliverables"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverable_versions_deliverable_id_fkey"
      columns: ["deliverable_id"]
isOneToOne: false
      referencedRelation: "portal_deliverables"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverable_versions_file_id_fkey"
      columns: ["file_id"]
isOneToOne: false
      referencedRelation: "files"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverable_versions_file_id_fkey"
      columns: ["file_id"]
isOneToOne: false
      referencedRelation: "portal_files"
      referencedColumns: ["id"]
    }
                  ]
                },"portal_deliverables": {
                  Row: {
                    "approved_at": string | null,"created_at": string,"current_version": number,"description": string | null,"due_date": string | null,"id": string,"milestone_id": string | null,"project_id": string,"status": Database["public"]['Enums']["deliverable_status"],"submitted_at": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                           "approved_at"?: string | null,"created_at"?: string | null,"current_version"?: number | null,"description"?: string | null,"due_date"?: string | null,"id"?: string | null,"milestone_id"?: string | null,"project_id"?: string | null,"status"?: Database["public"]['Enums']["deliverable_status"] | null,"submitted_at"?: string | null,"title"?: string | null,"updated_at"?: string | null
                         }
                        Update: {
                           "approved_at"?: string | null,"created_at"?: string | null,"current_version"?: number | null,"description"?: string | null,"due_date"?: string | null,"id"?: string | null,"milestone_id"?: string | null,"project_id"?: string | null,"status"?: Database["public"]['Enums']["deliverable_status"] | null,"submitted_at"?: string | null,"title"?: string | null,"updated_at"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "deliverables_milestone_id_fkey"
      columns: ["milestone_id"]
isOneToOne: false
      referencedRelation: "milestones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverables_milestone_id_fkey"
      columns: ["milestone_id"]
isOneToOne: false
      referencedRelation: "portal_milestones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverables_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliverables_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"portal_files": {
                  Row: {
                    "category": string,"client_id": string | null,"created_at": string,"id": string,"mime_type": string,"name": string,"organization_id": string,"project_id": string | null,"size_bytes": number,"uploaded_by": string | null,"uploaded_by_name": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "files_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "files_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "files_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "files_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "files_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "files_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "files_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"portal_invoice_items": {
                  Row: {
                    "amount_cents": number,"description": string,"id": string,"invoice_id": string,"quantity": number,"sort_order": number,"unit_price_cents": number
                  }
                  ComputedFields: never
                  Insert: {
                           "amount_cents"?: number | null,"description"?: string | null,"id"?: string | null,"invoice_id"?: string | null,"quantity"?: number | null,"sort_order"?: number | null,"unit_price_cents"?: number | null
                         }
                        Update: {
                           "amount_cents"?: number | null,"description"?: string | null,"id"?: string | null,"invoice_id"?: string | null,"quantity"?: number | null,"sort_order"?: number | null,"unit_price_cents"?: number | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "invoice_items_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
      referencedRelation: "invoices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoice_items_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
      referencedRelation: "portal_invoices"
      referencedColumns: ["id"]
    }
                  ]
                },"portal_invoices": {
                  Row: {
                    "amount_paid_cents": number,"balance_cents": number | null,"client_id": string,"created_at": string,"currency": string,"discount_cents": number,"discount_type": Database["public"]['Enums']["discount_type"],"discount_value": number,"due_date": string,"id": string,"issue_date": string,"notes": string | null,"number": string,"organization_id": string,"paid_at": string | null,"payment_terms": string | null,"project_id": string | null,"sent_at": string | null,"status": Database["public"]['Enums']["invoice_status"],"subtotal_cents": number,"tax_cents": number,"tax_rate_bps": number,"total_cents": number
                  }
                  ComputedFields: never
                  Insert: {
                           "amount_paid_cents"?: number | null,"balance_cents"?: number | null,"client_id"?: string | null,"created_at"?: string | null,"currency"?: string | null,"discount_cents"?: number | null,"discount_type"?: Database["public"]['Enums']["discount_type"] | null,"discount_value"?: number | null,"due_date"?: string | null,"id"?: string | null,"issue_date"?: string | null,"notes"?: string | null,"number"?: string | null,"organization_id"?: string | null,"paid_at"?: string | null,"payment_terms"?: string | null,"project_id"?: string | null,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["invoice_status"] | null,"subtotal_cents"?: number | null,"tax_cents"?: number | null,"tax_rate_bps"?: number | null,"total_cents"?: number | null
                         }
                        Update: {
                           "amount_paid_cents"?: number | null,"balance_cents"?: number | null,"client_id"?: string | null,"created_at"?: string | null,"currency"?: string | null,"discount_cents"?: number | null,"discount_type"?: Database["public"]['Enums']["discount_type"] | null,"discount_value"?: number | null,"due_date"?: string | null,"id"?: string | null,"issue_date"?: string | null,"notes"?: string | null,"number"?: string | null,"organization_id"?: string | null,"paid_at"?: string | null,"payment_terms"?: string | null,"project_id"?: string | null,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["invoice_status"] | null,"subtotal_cents"?: number | null,"tax_cents"?: number | null,"tax_rate_bps"?: number | null,"total_cents"?: number | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "invoices_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"portal_milestones": {
                  Row: {
                    "completed_at": string | null,"description": string | null,"due_date": string | null,"id": string,"project_id": string,"sort_order": number,"start_date": string | null,"status": Database["public"]['Enums']["milestone_status"],"title": string
                  }
                  ComputedFields: never
                  Insert: {
                           "completed_at"?: string | null,"description"?: string | null,"due_date"?: string | null,"id"?: string | null,"project_id"?: string | null,"sort_order"?: number | null,"start_date"?: string | null,"status"?: Database["public"]['Enums']["milestone_status"] | null,"title"?: string | null
                         }
                        Update: {
                           "completed_at"?: string | null,"description"?: string | null,"due_date"?: string | null,"id"?: string | null,"project_id"?: string | null,"sort_order"?: number | null,"start_date"?: string | null,"status"?: Database["public"]['Enums']["milestone_status"] | null,"title"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "milestones_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "milestones_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"portal_my_contact": {
                  Row: {
                    "client_id": string,"email": string,"full_name": string,"id": string,"is_primary": boolean,"job_title": string | null,"phone": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "client_id"?: string | null,"email"?: string | null,"full_name"?: string | null,"id"?: string | null,"is_primary"?: boolean | null,"job_title"?: string | null,"phone"?: string | null
                         }
                        Update: {
                           "client_id"?: string | null,"email"?: string | null,"full_name"?: string | null,"id"?: string | null,"is_primary"?: boolean | null,"job_title"?: string | null,"phone"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "client_contacts_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "client_contacts_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    }
                  ]
                },"portal_payments": {
                  Row: {
                    "amount_cents": number,"created_at": string,"id": string,"invoice_id": string,"method": Database["public"]['Enums']["payment_method"],"payment_date": string,"reference": string | null,"status": Database["public"]['Enums']["payment_status"]
                  }
                  ComputedFields: never
                  Insert: {
                           "amount_cents"?: number | null,"created_at"?: string | null,"id"?: string | null,"invoice_id"?: string | null,"method"?: Database["public"]['Enums']["payment_method"] | null,"payment_date"?: string | null,"reference"?: string | null,"status"?: Database["public"]['Enums']["payment_status"] | null
                         }
                        Update: {
                           "amount_cents"?: number | null,"created_at"?: string | null,"id"?: string | null,"invoice_id"?: string | null,"method"?: Database["public"]['Enums']["payment_method"] | null,"payment_date"?: string | null,"reference"?: string | null,"status"?: Database["public"]['Enums']["payment_status"] | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "payments_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
      referencedRelation: "invoices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
      referencedRelation: "portal_invoices"
      referencedColumns: ["id"]
    }
                  ]
                },"portal_projects": {
                  Row: {
                    "client_id": string,"code": string,"completed_at": string | null,"created_at": string,"description": string | null,"due_date": string | null,"id": string,"name": string,"organization_id": string,"priority": Database["public"]['Enums']["priority_level"],"progress": number,"project_manager_avatar": string | null,"project_manager_email": string | null,"project_manager_id": string | null,"project_manager_name": string | null,"scope": string | null,"service_name": string | null,"start_date": string | null,"status": Database["public"]['Enums']["project_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "projects_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "projects_project_manager_id_fkey"
      columns: ["project_manager_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"portal_proposal_items": {
                  Row: {
                    "amount_cents": number,"description": string,"details": string | null,"id": string,"proposal_id": string,"quantity": number,"sort_order": number,"unit_price_cents": number
                  }
                  ComputedFields: never
                  Insert: {
                           "amount_cents"?: number | null,"description"?: string | null,"details"?: string | null,"id"?: string | null,"proposal_id"?: string | null,"quantity"?: number | null,"sort_order"?: number | null,"unit_price_cents"?: number | null
                         }
                        Update: {
                           "amount_cents"?: number | null,"description"?: string | null,"details"?: string | null,"id"?: string | null,"proposal_id"?: string | null,"quantity"?: number | null,"sort_order"?: number | null,"unit_price_cents"?: number | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "proposal_items_proposal_id_fkey"
      columns: ["proposal_id"]
isOneToOne: false
      referencedRelation: "portal_proposals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proposal_items_proposal_id_fkey"
      columns: ["proposal_id"]
isOneToOne: false
      referencedRelation: "proposals"
      referencedColumns: ["id"]
    }
                  ]
                },"portal_proposals": {
                  Row: {
                    "client_id": string | null,"client_response_note": string | null,"created_at": string,"currency": string,"discount_cents": number,"discount_type": Database["public"]['Enums']["discount_type"],"discount_value": number,"id": string,"number": string,"organization_id": string,"payment_terms": string | null,"responded_at": string | null,"scope": string | null,"sent_at": string | null,"status": Database["public"]['Enums']["proposal_status"],"subtotal_cents": number,"summary": string | null,"tax_cents": number,"tax_rate_bps": number,"timeline": string | null,"title": string,"total_cents": number,"valid_until": string | null,"viewed_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "client_id"?: string | null,"client_response_note"?: string | null,"created_at"?: string | null,"currency"?: string | null,"discount_cents"?: number | null,"discount_type"?: Database["public"]['Enums']["discount_type"] | null,"discount_value"?: number | null,"id"?: string | null,"number"?: string | null,"organization_id"?: string | null,"payment_terms"?: string | null,"responded_at"?: string | null,"scope"?: string | null,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["proposal_status"] | null,"subtotal_cents"?: number | null,"summary"?: string | null,"tax_cents"?: number | null,"tax_rate_bps"?: number | null,"timeline"?: string | null,"title"?: string | null,"total_cents"?: number | null,"valid_until"?: string | null,"viewed_at"?: string | null
                         }
                        Update: {
                           "client_id"?: string | null,"client_response_note"?: string | null,"created_at"?: string | null,"currency"?: string | null,"discount_cents"?: number | null,"discount_type"?: Database["public"]['Enums']["discount_type"] | null,"discount_value"?: number | null,"id"?: string | null,"number"?: string | null,"organization_id"?: string | null,"payment_terms"?: string | null,"responded_at"?: string | null,"scope"?: string | null,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["proposal_status"] | null,"subtotal_cents"?: number | null,"summary"?: string | null,"tax_cents"?: number | null,"tax_rate_bps"?: number | null,"timeline"?: string | null,"title"?: string | null,"total_cents"?: number | null,"valid_until"?: string | null,"viewed_at"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "proposals_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proposals_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "portal_clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proposals_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proposals_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "portal_agency"
      referencedColumns: ["organization_id"]
    }
                  ]
                },"portal_revisions": {
                  Row: {
                    "created_at": string,"deliverable_id": string | null,"description": string,"id": string,"project_id": string,"resolved_at": string | null,"status": Database["public"]['Enums']["revision_status"]
                  }
                  ComputedFields: never
                  Insert: {
                           "created_at"?: string | null,"deliverable_id"?: string | null,"description"?: string | null,"id"?: string | null,"project_id"?: string | null,"resolved_at"?: string | null,"status"?: Database["public"]['Enums']["revision_status"] | null
                         }
                        Update: {
                           "created_at"?: string | null,"deliverable_id"?: string | null,"description"?: string | null,"id"?: string | null,"project_id"?: string | null,"resolved_at"?: string | null,"status"?: Database["public"]['Enums']["revision_status"] | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "revisions_deliverable_id_fkey"
      columns: ["deliverable_id"]
isOneToOne: false
      referencedRelation: "deliverables"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "revisions_deliverable_id_fkey"
      columns: ["deliverable_id"]
isOneToOne: false
      referencedRelation: "portal_deliverables"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "revisions_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "revisions_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"portal_tasks": {
                  Row: {
                    "completed_at": string | null,"description": string | null,"due_date": string | null,"id": string,"milestone_id": string | null,"priority": Database["public"]['Enums']["priority_level"],"project_id": string,"requires_client_action": boolean,"sort_order": number,"status": Database["public"]['Enums']["task_status"],"title": string
                  }
                  ComputedFields: never
                  Insert: {
                           "completed_at"?: string | null,"description"?: string | null,"due_date"?: string | null,"id"?: string | null,"milestone_id"?: string | null,"priority"?: Database["public"]['Enums']["priority_level"] | null,"project_id"?: string | null,"requires_client_action"?: boolean | null,"sort_order"?: number | null,"status"?: Database["public"]['Enums']["task_status"] | null,"title"?: string | null
                         }
                        Update: {
                           "completed_at"?: string | null,"description"?: string | null,"due_date"?: string | null,"id"?: string | null,"milestone_id"?: string | null,"priority"?: Database["public"]['Enums']["priority_level"] | null,"project_id"?: string | null,"requires_client_action"?: boolean | null,"sort_order"?: number | null,"status"?: Database["public"]['Enums']["task_status"] | null,"title"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "tasks_milestone_id_fkey"
      columns: ["milestone_id"]
isOneToOne: false
      referencedRelation: "milestones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_milestone_id_fkey"
      columns: ["milestone_id"]
isOneToOne: false
      referencedRelation: "portal_milestones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "portal_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "apply_project_template":
{ Args: { "p_project": string,"p_start"?: string,"p_template": string }; Returns: number
                           },
"bootstrap_organization":
{ Args: { "p_currency"?: string,"p_name": string,"p_owner": string,"p_slug": string,"p_timezone"?: string }; Returns: string
                           },
"calc_discount_cents":
{ Args: { "p_subtotal": number,"p_type": Database["public"]['Enums']["discount_type"],"p_value": number }; Returns: number
                           },
"calc_line_amount":
{ Args: { "p_quantity": number,"p_unit_price_cents": number }; Returns: number
                           },
"calc_tax_cents":
{ Args: { "p_tax_rate_bps": number,"p_taxable": number }; Returns: number
                           },
"can_access_conversation":
{ Args: { "p_conversation": string }; Returns: boolean
                           },
"can_manage_project":
{ Args: { "p_project": string }; Returns: boolean
                           },
"can_view_project":
{ Args: { "p_project": string }; Returns: boolean
                           },
"check_rate_limit":
{ Args: { "p_cost"?: number,"p_key": string,"p_max": number,"p_window_seconds": number }; Returns: boolean
                           },
"claim_email_batch":
{ Args: { "p_limit"?: number }; Returns: {
              "attempts": number,
"created_at": string,
"id": string,
"idempotency_key": string,
"last_error": string | null,
"locked_at": string | null,
"max_attempts": number,
"next_attempt_at": string,
"organization_id": string | null,
"payload": NonNullable<Json>,
"provider": string | null,
"provider_message_id": string | null,
"sent_at": string | null,
"status": Database["public"]['Enums']["email_status"],
"template": string,
"to_email": string,
"to_name": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "email_outbox"
        isOneToOne: false
        isSetofReturn: true
      } },
"client_can_view_project":
{ Args: { "p_project": string }; Returns: boolean
                           },
"complete_email":
{ Args: { "p_error": string,"p_id": string,"p_message_id": string,"p_ok": boolean,"p_provider": string }; Returns: undefined
                           },
"convert_lead":
{ Args: { "p_client"?: Json,"p_lead": string,"p_mark_won"?: boolean,"p_project"?: Json }; Returns: Json
                           },
"create_invoice_from_proposal":
{ Args: { "p_due_days"?: number,"p_percent"?: number,"p_proposal": string }; Returns: string
                           },
"create_project_from_proposal":
{ Args: { "p_options"?: Json,"p_proposal": string,"p_template"?: string }; Returns: Json
                           },
"has_permission":
{ Args: { "p_org": string,"p_perm": string }; Returns: boolean
                           },
"is_client_user":
{ Args: { "p_client": string }; Returns: boolean
                           },
"is_org_member":
{ Args: { "p_org": string }; Returns: boolean
                           },
"is_project_member":
{ Args: { "p_project": string }; Returns: boolean
                           },
"my_client_ids":
{ Args: Record<PropertyKey, never>; Returns: string[]
                           },
"portal_accept_contract":
{ Args: { "p_contract": string }; Returns: undefined
                           },
"portal_mark_proposal_viewed":
{ Args: { "p_proposal": string }; Returns: undefined
                           },
"portal_respond_proposal":
{ Args: { "p_decision": string,"p_note"?: string,"p_proposal": string }; Returns: undefined
                           },
"portal_review_deliverable":
{ Args: { "p_decision": Database["public"]['Enums']["review_decision"],"p_deliverable": string,"p_feedback"?: string }; Returns: undefined
                           },
"portal_touch":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"portal_update_my_contact":
{ Args: { "p_full_name": string,"p_job_title": string,"p_phone": string }; Returns: undefined
                           },
"replace_document_items":
{ Args: { "p_id": string,"p_items": Json,"p_kind": string }; Returns: undefined
                           },
"report_lead_breakdown":
{ Args: { "p_from": string,"p_org": string,"p_to": string }; Returns: {
              "dimension": string,"key": string,"total": number,"won": number
            }[]
                           },
"report_lead_funnel":
{ Args: { "p_from": string,"p_org": string,"p_to": string }; Returns: {
              "created": number,"lost": number,"month": string,"won": number
            }[]
                           },
"report_monthly_finance":
{ Args: { "p_from": string,"p_org": string,"p_to": string }; Returns: {
              "expenses_cents": number,"invoiced_cents": number,"month": string,"revenue_cents": number
            }[]
                           },
"report_project_delivery":
{ Args: { "p_from": string,"p_org": string,"p_to": string }; Returns: {
              "active": number,"avg_days_late": number,"completed": number,"late": number,"on_time": number,"overdue": number
            }[]
                           },
"report_project_profitability":
{ Args: { "p_org": string }; Returns: {
              "client_name": string,"code": string,"collected_cents": number,"contract_value_cents": number,"expenses_cents": number,"hours": number,"invoiced_cents": number,"labor_cost_cents": number,"name": string,"profit_cents": number,"project_id": string,"status": Database["public"]['Enums']["project_status"]
            }[]
                           },
"report_revenue_by_client":
{ Args: { "p_from": string,"p_org": string,"p_to": string }; Returns: {
              "client_id": string,"client_name": string,"invoiced_cents": number,"outstanding_cents": number,"projects": number,"revenue_cents": number
            }[]
                           },
"report_revenue_by_service":
{ Args: { "p_from": string,"p_org": string,"p_to": string }; Returns: {
              "projects": number,"revenue_cents": number,"service_name": string
            }[]
                           },
"report_team_workload":
{ Args: { "p_org": string }; Returns: {
              "active_projects": number,"capacity_hours": number,"due_this_week": number,"estimated_hours": number,"full_name": string,"logged_hours_30d": number,"open_tasks": number,"overdue_tasks": number,"profile_id": string,"role_key": string
            }[]
                           },
"run_scheduled_automations":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"team_role":
{ Args: { "p_org": string }; Returns: string
                           },
"user_org_ids":
{ Args: Record<PropertyKey, never>; Returns: string[]
                           }
          }
          Enums: {
            "client_status": "active"|"inactive"|"archived","client_type": "individual"|"company","contract_status": "draft"|"sent"|"signed"|"active"|"expired"|"terminated","deliverable_status": "draft"|"submitted"|"approved"|"changes_requested","discount_type": "none"|"percent"|"fixed","email_status": "pending"|"sending"|"sent"|"failed"|"cancelled","file_visibility": "internal"|"client","invoice_status": "draft"|"sent"|"partially_paid"|"paid"|"overdue"|"cancelled","lead_status": "new"|"contacted"|"discovery"|"qualified"|"proposal_sent"|"negotiation"|"won"|"lost"|"not_qualified","meeting_status": "requested"|"scheduled"|"completed"|"cancelled","member_status": "invited"|"active"|"deactivated","milestone_status": "pending"|"in_progress"|"completed","payment_method": "bank_transfer"|"card"|"cash"|"cheque"|"upi"|"paypal"|"stripe"|"other","payment_status": "pending"|"completed"|"failed"|"refunded","priority_level": "low"|"medium"|"high"|"urgent","project_status": "draft"|"planning"|"in_progress"|"on_hold"|"awaiting_client"|"in_review"|"completed"|"cancelled","proposal_status": "draft"|"sent"|"viewed"|"accepted"|"rejected"|"expired","review_decision": "approved"|"changes_requested","revision_status": "open"|"in_progress"|"resolved","task_status": "todo"|"in_progress"|"in_review"|"blocked"|"done"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "client_status": ["active", "inactive", "archived"],"client_type": ["individual", "company"],"contract_status": ["draft", "sent", "signed", "active", "expired", "terminated"],"deliverable_status": ["draft", "submitted", "approved", "changes_requested"],"discount_type": ["none", "percent", "fixed"],"email_status": ["pending", "sending", "sent", "failed", "cancelled"],"file_visibility": ["internal", "client"],"invoice_status": ["draft", "sent", "partially_paid", "paid", "overdue", "cancelled"],"lead_status": ["new", "contacted", "discovery", "qualified", "proposal_sent", "negotiation", "won", "lost", "not_qualified"],"meeting_status": ["requested", "scheduled", "completed", "cancelled"],"member_status": ["invited", "active", "deactivated"],"milestone_status": ["pending", "in_progress", "completed"],"payment_method": ["bank_transfer", "card", "cash", "cheque", "upi", "paypal", "stripe", "other"],"payment_status": ["pending", "completed", "failed", "refunded"],"priority_level": ["low", "medium", "high", "urgent"],"project_status": ["draft", "planning", "in_progress", "on_hold", "awaiting_client", "in_review", "completed", "cancelled"],"proposal_status": ["draft", "sent", "viewed", "accepted", "rejected", "expired"],"review_decision": ["approved", "changes_requested"],"revision_status": ["open", "in_progress", "resolved"],"task_status": ["todo", "in_progress", "in_review", "blocked", "done"]
          }
        }
} as const
