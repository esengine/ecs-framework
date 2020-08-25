/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

module FUI.sc {

	export class UI_combo_sc_popup extends fairygui.GComponent {
		public m_list:fairygui.GList;
		public static URL:string = "ui://m4sln17ajde14";

		public static createInstance():UI_combo_sc_popup {
			return <UI_combo_sc_popup>(fairygui.UIPackage.createObject("sc", "combo_sc_popup"));
		}

		protected constructFromXML(xml:any):void {
			super.constructFromXML(xml);

			this.m_list = <fairygui.GList>(this.getChildAt(1));
		}
	}
}